import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userType, newPassword, identifier } = await req.json();

    if (!userId || !userType || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get school info for confirmation message
    const { data: school } = await supabase.from("school_info").select("school_name").single();
    const schoolName = school?.school_name || "School";

    let updateError = null;
    let userPhone = "";
    let userEmail = "";
    let userName = "";

    // Update password based on user type
    if (userType === "learner") {
      // For learners, we update the birth_certificate_number as their password
      // First get learner info
      const { data: learner, error: fetchError } = await supabase
        .from("learners")
        .select("id, first_name, last_name, parent_id")
        .eq("id", userId)
        .single();

      if (fetchError || !learner) {
        return new Response(
          JSON.stringify({ success: false, message: "Learner not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      userName = `${learner.first_name} ${learner.last_name}`;

      // Get parent contact info
      if (learner.parent_id) {
        const { data: parent } = await supabase
          .from("parents")
          .select("phone, email")
          .eq("id", learner.parent_id)
          .single();
        
        if (parent) {
          userPhone = parent.phone || "";
          userEmail = parent.email || "";
        }
      }

      // Update the birth certificate number (password for learners)
      const { error } = await supabase
        .from("learners")
        .update({ birth_certificate_number: newPassword })
        .eq("id", userId);
      
      updateError = error;

    } else if (userType === "teacher") {
      // For teachers, we update the id_number as their password
      const { data: teacher, error: fetchError } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, phone, email")
        .eq("id", userId)
        .single();

      if (fetchError || !teacher) {
        return new Response(
          JSON.stringify({ success: false, message: "Teacher not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      userName = `${teacher.first_name} ${teacher.last_name}`;
      userPhone = teacher.phone || "";
      userEmail = teacher.email || "";

      // Update the ID number (password for teachers)
      const { error } = await supabase
        .from("teachers")
        .update({ id_number: newPassword })
        .eq("id", userId);
      
      updateError = error;

    } else if (userType === "employee") {
      // For non-teaching staff, update id_number
      const { data: staff, error: fetchError } = await supabase
        .from("non_teaching_staff")
        .select("id, first_name, last_name, phone, email")
        .eq("id", userId)
        .single();

      if (fetchError || !staff) {
        return new Response(
          JSON.stringify({ success: false, message: "Staff member not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      userName = `${staff.first_name} ${staff.last_name}`;
      userPhone = staff.phone || "";
      userEmail = staff.email || "";

      const { error } = await supabase
        .from("non_teaching_staff")
        .update({ id_number: newPassword })
        .eq("id", userId);
      
      updateError = error;

    } else if (userType === "admin") {
      // For admins, we update the auth.users password
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        updateError = error;
      } else {
        // Get admin info for notification
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone_number")
          .eq("id", userId)
          .single();
        
        userName = profile?.full_name || "User";
        userPhone = profile?.phone_number || "";
        
        // Get email from auth
        const { data: authData } = await supabase.auth.admin.getUserById(userId);
        userEmail = authData?.user?.email || "";
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid user type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to update password" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log the password reset for audit
    try {
      await supabase.from("activity_logs").insert({
        action: "password_reset",
        entity_type: userType,
        entity_id: userId,
        entity_name: userName,
        user_id: null,
        user_name: "System",
        user_role: "system",
        details: { 
          identifier: identifier,
          user_type: userType,
          reset_method: "otp_verification"
        }
      });
    } catch (logError) {
      console.error("Failed to log password reset:", logError);
    }

    // Send confirmation notifications
    const confirmationMessage = `Your ${schoolName} password has been successfully reset. You can now log in with your new password. If you did not make this change, please contact the administrator immediately.`;

    // Send SMS confirmation
    if (userPhone) {
      const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
      if (apiKey) {
        const formattedPhone = formatPhoneNumber(userPhone);
        try {
          await fetch("https://sms.textsms.co.ke/api/services/sendsms/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apikey: apiKey,
              partnerID: 15265,
              message: confirmationMessage,
              shortcode: "TextSMS",
              mobile: formattedPhone,
            }),
          });
          console.log("SMS confirmation sent to:", formattedPhone.slice(-4));
        } catch (smsError) {
          console.error("SMS confirmation error:", smsError);
        }
      }
    }

    // Send email confirmation
    if (userEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        try {
          await resend.emails.send({
            from: `${schoolName} <onboarding@resend.dev>`,
            to: [userEmail],
            subject: "Password Reset Successful",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset Successful</h2>
                <p>Hello ${userName},</p>
                <p>Your ${schoolName} password has been successfully reset. You can now log in with your new password.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #333;"><strong>Security Notice:</strong> If you did not make this change, please contact the school administrator immediately.</p>
                </div>
                <p style="color: #666;">Best regards,<br>${schoolName}</p>
              </div>
            `,
          });
          console.log("Email confirmation sent to:", userEmail);
        } catch (emailError) {
          console.error("Email confirmation error:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset successful",
        userName: userName
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
