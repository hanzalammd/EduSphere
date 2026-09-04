-- EduSphere: normalize old numeric class names (10, 11, etc.) to Grade 10, Grade 11.
-- Also keeps existing students, timetables and date sheets connected when duplicate
-- numeric + Grade classes already exist.

DO $$
DECLARE
  old_class record;
  target_id uuid;
  canonical_name text;
BEGIN
  FOR old_class IN
    SELECT id, name, academic_year
    FROM public.classes
    WHERE section = ''
      AND trim(name) ~ '^[0-9]+$'
  LOOP
    canonical_name := 'Grade ' || trim(old_class.name);

    SELECT id INTO target_id
    FROM public.classes
    WHERE section = ''
      AND academic_year = old_class.academic_year
      AND lower(trim(name)) = lower(canonical_name)
      AND id <> old_class.id
    LIMIT 1;

    IF target_id IS NULL THEN
      UPDATE public.classes
      SET name = canonical_name
      WHERE id = old_class.id;
      target_id := old_class.id;
    ELSE
      -- Move all dependent records to the clean class before removing the duplicate.
      UPDATE public.students
      SET class_id = target_id,
          class_name = canonical_name,
          section = NULL
      WHERE class_id = old_class.id;

      UPDATE public.class_timetable
      SET class_id = target_id
      WHERE class_id = old_class.id
        AND NOT EXISTS (
          SELECT 1 FROM public.class_timetable t2
          WHERE t2.class_id = target_id
            AND t2.day_of_week = class_timetable.day_of_week
            AND t2.period_no = class_timetable.period_no
        );

      DELETE FROM public.class_timetable WHERE class_id = old_class.id;

      UPDATE public.class_date_sheet
      SET class_id = target_id
      WHERE class_id = old_class.id
        AND NOT EXISTS (
          SELECT 1 FROM public.class_date_sheet d2
          WHERE d2.class_id = target_id
            AND d2.exam_name = class_date_sheet.exam_name
            AND d2.exam_date = class_date_sheet.exam_date
            AND d2.subject = class_date_sheet.subject
        );

      DELETE FROM public.class_date_sheet WHERE class_id = old_class.id;

      UPDATE public.students
      SET class_name = canonical_name,
          section = NULL
      WHERE lower(trim(class_name)) = lower(trim(old_class.name));

      DELETE FROM public.classes WHERE id = old_class.id;
    END IF;
  END LOOP;

  -- Normalize student text even when no duplicate class row existed.
  UPDATE public.students
  SET class_name = 'Grade ' || trim(class_name),
      section = NULL
  WHERE trim(class_name) ~ '^[0-9]+$';
END $$;

-- Prevent future numeric/Grade duplicates for section-less classes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_classes_clean_name_year
  ON public.classes(lower(trim(name)), academic_year)
  WHERE section = '';
