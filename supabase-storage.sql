-- Supabase Storage 설정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage 정책 설정
-- 사용자는 자신의 리뷰 미디어만 업로드할 수 있음
CREATE POLICY "Users can upload their own review media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'review-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 리뷰 미디어만 조회할 수 있음
CREATE POLICY "Users can view their own review media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'review-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 리뷰 미디어만 삭제할 수 있음
CREATE POLICY "Users can delete their own review media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'review-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 관리자는 모든 미디어에 접근 가능
CREATE POLICY "Admins can manage all review media" ON storage.objects
FOR ALL USING (
  bucket_id = 'review-media' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- 에이전시는 자신의 지점 리뷰 미디어에 접근 가능
CREATE POLICY "Agency owners can view their branch review media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'review-media' AND
  EXISTS (
    SELECT 1 FROM users u
    JOIN agencies a ON a.owner_id = u.id
    JOIN branches b ON b.agency_id = a.id
    JOIN reviews r ON r.branch_id = b.id
    JOIN review_media rm ON rm.review_id = r.id
    WHERE u.auth_id = auth.uid() 
    AND u.role = 'agency_owner'
    AND rm.file_path = name
  )
);
