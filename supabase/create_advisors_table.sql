-- 创建顾问表
CREATE TABLE IF NOT EXISTS advisors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_kr VARCHAR(100),
  phone VARCHAR(50),
  wechat VARCHAR(100),
  kakao_talk VARCHAR(100),
  avatar TEXT,
  gender VARCHAR(20),
  languages TEXT[], -- 数组类型
  specialties TEXT[], -- 数组类型
  experience INTEGER DEFAULT 0,
  service_areas TEXT[], -- 数组类型
  service_types TEXT[], -- 数组类型
  introduction TEXT,
  introduction_kr TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  total_services INTEGER DEFAULT 0,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  accompany_fee DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  tags TEXT[], -- 数组类型
  qr_codes JSONB, -- JSON类型存储二维码信息
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX idx_advisors_status ON advisors(status);
CREATE INDEX idx_advisors_featured ON advisors(featured);
CREATE INDEX idx_advisors_sort_order ON advisors(sort_order);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advisors_updated_at
  BEFORE UPDATE ON advisors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 插入默认数据
INSERT INTO advisors (
  id, name, name_kr, phone, wechat, kakao_talk, gender,
  languages, specialties, experience, service_areas, service_types,
  introduction, introduction_kr, rating, review_count, total_services,
  consultation_fee, accompany_fee, status, featured, tags, sort_order
) VALUES
(
  'advisor_001',
  '小美顾问',
  '샤오메이',
  '010-1234-5678',
  'xiaomei_service',
  'xiaomei_kr',
  'female',
  ARRAY['中文', '韩语'],
  ARRAY['医美咨询', '整形咨询'],
  5,
  ARRAY['江南区', '瑞草区'],
  ARRAY['陪同翻译', '项目咨询', '预约安排'],
  '5年医美陪同经验，熟悉首尔各大医美机构',
  '5년 의료미용 동행 경험, 서울 주요 병원 잘 알고 있습니다',
  4.9,
  156,
  200,
  0,
  300,
  'active',
  true,
  ARRAY['资深顾问', '双语服务', '医美专家'],
  10
),
(
  'advisor_002',
  '李明顾问',
  '리밍',
  '010-2345-6789',
  'liming_consultant',
  'liming_kr',
  'male',
  ARRAY['中文', '韩语', '英语'],
  ARRAY['整形咨询', '术后护理'],
  3,
  ARRAY['江南区', '明洞'],
  ARRAY['陪同翻译', '术后跟进'],
  '3年医美行业经验，专注整形项目咨询',
  '3년 의료미용 업계 경험, 성형 프로젝트 상담 전문',
  4.7,
  89,
  120,
  0,
  250,
  'active',
  false,
  ARRAY['整形专家', '多语言'],
  5
)
ON CONFLICT (id) DO NOTHING;

-- 开启RLS (Row Level Security) - 允许公开读取，但写入需要认证
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取
CREATE POLICY "Allow public read" ON advisors
  FOR SELECT USING (true);

-- 创建策略：只允许认证用户写入（可选）
-- CREATE POLICY "Allow authenticated write" ON advisors
--   FOR ALL USING (auth.role() = 'authenticated');