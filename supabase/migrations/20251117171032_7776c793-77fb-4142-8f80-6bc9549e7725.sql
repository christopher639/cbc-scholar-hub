-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent', 'student');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.grade_level AS ENUM ('grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'grade_7', 'grade_8', 'grade_9', 'grade_10', 'grade_11', 'grade_12');
CREATE TYPE public.term AS ENUM ('term_1', 'term_2', 'term_3');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (CRITICAL: separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create school_info table
CREATE TABLE public.school_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  motto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.school_info ENABLE ROW LEVEL SECURITY;

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  grade_level public.grade_level NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create streams table
CREATE TABLE public.streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID REFERENCES public.grades(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grade_id, name)
);

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  employee_number TEXT UNIQUE,
  specialization TEXT,
  hired_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create learning_areas table
CREATE TABLE public.learning_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.learning_areas ENABLE ROW LEVEL SECURITY;

-- Create parents table
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT,
  occupation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Create learners table
CREATE TABLE public.learners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender public.gender NOT NULL,
  current_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  current_stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  medical_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;

-- Create academic_periods table
CREATE TABLE public.academic_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year TEXT NOT NULL,
  term public.term NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academic_year, term)
);

ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;

-- Create performance_records table
CREATE TABLE public.performance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  learning_area_id UUID REFERENCES public.learning_areas(id) ON DELETE CASCADE NOT NULL,
  academic_period_id UUID REFERENCES public.academic_periods(id) ON DELETE CASCADE NOT NULL,
  grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL NOT NULL,
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  marks DECIMAL(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
  grade_letter TEXT,
  remarks TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, learning_area_id, academic_period_id)
);

ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

-- Create promotion_history table
CREATE TABLE public.promotion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  from_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  from_stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  to_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL NOT NULL,
  to_stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL,
  promotion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.promotion_history ENABLE ROW LEVEL SECURITY;

-- Create fee_structures table
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID REFERENCES public.grades(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  term public.term NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grade_id, academic_year, term)
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- Create fee_payments table
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE NOT NULL,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE CASCADE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid >= 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  receipt_number TEXT UNIQUE,
  status public.payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_info_updated_at BEFORE UPDATE ON public.school_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON public.streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_areas_updated_at BEFORE UPDATE ON public.learning_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learners_updated_at BEFORE UPDATE ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_periods_updated_at BEFORE UPDATE ON public.academic_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON public.performance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for school_info
CREATE POLICY "Everyone can view school info"
  ON public.school_info FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage school info"
  ON public.school_info FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for grades
CREATE POLICY "Everyone can view grades"
  ON public.grades FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage grades"
  ON public.grades FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for streams
CREATE POLICY "Everyone can view streams"
  ON public.streams FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage streams"
  ON public.streams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teachers
CREATE POLICY "Everyone can view teachers"
  ON public.teachers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own profile"
  ON public.teachers FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for learning_areas
CREATE POLICY "Everyone can view learning areas"
  ON public.learning_areas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage learning areas"
  ON public.learning_areas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage their learning areas"
  ON public.learning_areas FOR UPDATE
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

-- RLS Policies for parents
CREATE POLICY "Parents can view their own profile"
  ON public.parents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all parents"
  ON public.parents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage parents"
  ON public.parents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parents can update their own profile"
  ON public.parents FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for learners
CREATE POLICY "Students can view their own profile"
  ON public.learners FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view their children"
  ON public.learners FOR SELECT
  USING (parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view all learners"
  ON public.learners FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins can manage learners"
  ON public.learners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for academic_periods
CREATE POLICY "Everyone can view academic periods"
  ON public.academic_periods FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage academic periods"
  ON public.academic_periods FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for performance_records
CREATE POLICY "Students can view their own performance"
  ON public.performance_records FOR SELECT
  USING (learner_id IN (SELECT id FROM public.learners WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view their children's performance"
  ON public.performance_records FOR SELECT
  USING (learner_id IN (
    SELECT id FROM public.learners WHERE parent_id IN (
      SELECT id FROM public.parents WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Teachers can view all performance records"
  ON public.performance_records FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can manage performance records"
  ON public.performance_records FOR ALL
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins can manage all performance records"
  ON public.performance_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for promotion_history
CREATE POLICY "Students can view their own promotion history"
  ON public.promotion_history FOR SELECT
  USING (learner_id IN (SELECT id FROM public.learners WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view their children's promotion history"
  ON public.promotion_history FOR SELECT
  USING (learner_id IN (
    SELECT id FROM public.learners WHERE parent_id IN (
      SELECT id FROM public.parents WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Teachers can view all promotion history"
  ON public.promotion_history FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins can manage promotion history"
  ON public.promotion_history FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for fee_structures
CREATE POLICY "Everyone can view fee structures"
  ON public.fee_structures FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage fee structures"
  ON public.fee_structures FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for fee_payments
CREATE POLICY "Students can view their own fee payments"
  ON public.fee_payments FOR SELECT
  USING (learner_id IN (SELECT id FROM public.learners WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view their children's fee payments"
  ON public.fee_payments FOR SELECT
  USING (learner_id IN (
    SELECT id FROM public.learners WHERE parent_id IN (
      SELECT id FROM public.parents WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can manage fee payments"
  ON public.fee_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.learners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_payments;