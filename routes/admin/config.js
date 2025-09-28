const router = require('express').Router();
const { verifyToken } = require('../../middleware/auth');

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

// 内存中存储配置（没有数据库时）
let configStore = {
  hot_searches: {
    items: [
      { keyword: '双眼皮', priority: 100, isHot: true },
      { keyword: '瘦脸针', priority: 90, isHot: true },
      { keyword: '玻尿酸', priority: 80, isHot: false }
    ]
  },
  filter_options: {
    districts: [
      // 首尔特别市主要区及下属地区
      {
        value: 'gangnam-gu',
        label: '江南区',
        labelKr: '강남구',
        children: [
          { value: 'gangnam', label: '江南站', labelKr: '강남역' },
          { value: 'sinsa', label: '新沙洞', labelKr: '신사동' },
          { value: 'apgujeong', label: '狎鸥亭', labelKr: '압구정' },
          { value: 'cheongdam', label: '清潭洞', labelKr: '청담동' },
          { value: 'yeoksam', label: '驿三洞', labelKr: '역삼동' },
          { value: 'daechi', label: '大峙洞', labelKr: '대치동' },
          { value: 'dogok', label: '道谷洞', labelKr: '도곡동' },
          { value: 'gaepo', label: '开浦洞', labelKr: '개포동' },
          { value: 'irwon', label: '一院洞', labelKr: '일원동' },
          { value: 'suseo', label: '水西洞', labelKr: '수서동' },
          { value: 'samsung', label: '三成洞', labelKr: '삼성동' },
          { value: 'nonhyeon', label: '论岘洞', labelKr: '논현동' }
        ]
      },
      {
        value: 'seocho-gu',
        label: '瑞草区',
        labelKr: '서초구',
        children: [
          { value: 'seocho', label: '瑞草洞', labelKr: '서초동' },
          { value: 'bangbae', label: '方背洞', labelKr: '방배동' },
          { value: 'yangjae', label: '良才洞', labelKr: '양재동' },
          { value: 'umyeon', label: '牛眠洞', labelKr: '우면동' },
          { value: 'naegok', label: '内谷洞', labelKr: '내곡동' },
          { value: 'yeomgok', label: '廉谷洞', labelKr: '염곡동' },
          { value: 'sinwon', label: '新院洞', labelKr: '신원동' },
          { value: 'jamsil', label: '蚕室洞', labelKr: '잠원동' },
          { value: 'banpo', label: '盘浦洞', labelKr: '반포동' }
        ]
      },
      {
        value: 'songpa-gu',
        label: '松坡区',
        labelKr: '송파구',
        children: [
          { value: 'jamsil', label: '蚕室', labelKr: '잠실' },
          { value: 'songpa', label: '松坡洞', labelKr: '송파동' },
          { value: 'garak', label: '可乐洞', labelKr: '가락동' },
          { value: 'munjeong', label: '文井洞', labelKr: '문정동' },
          { value: 'seokchon', label: '石村洞', labelKr: '석촌동' },
          { value: 'samjeon', label: '三田洞', labelKr: '삼전동' },
          { value: 'ogeum', label: '梧琴洞', labelKr: '오금동' },
          { value: 'bangi', label: '芳荑洞', labelKr: '방이동' },
          { value: 'macheon', label: '马川洞', labelKr: '마천동' },
          { value: 'geoyeo', label: '巨余洞', labelKr: '거여동' },
          { value: 'wirye', label: '渭礼洞', labelKr: '위례동' }
        ]
      },
      {
        value: 'jung-gu',
        label: '中区',
        labelKr: '중구',
        children: [
          { value: 'myeongdong', label: '明洞', labelKr: '명동' },
          { value: 'euljiro', label: '乙支路', labelKr: '을지로' },
          { value: 'chungmuro', label: '忠武路', labelKr: '충무로' },
          { value: 'namdaemun', label: '南大门', labelKr: '남대문' },
          { value: 'hoehyeon', label: '会贤洞', labelKr: '회현동' },
          { value: 'sogong', label: '小公洞', labelKr: '소공동' },
          { value: 'jeong', label: '贞洞', labelKr: '정동' },
          { value: 'mugyo', label: '武桥洞', labelKr: '무교동' },
          { value: 'dasan', label: '茶山洞', labelKr: '다산동' },
          { value: 'yaksu', label: '药水洞', labelKr: '약수동' },
          { value: 'cheonggu', label: '青丘洞', labelKr: '청구동' },
          { value: 'sindang', label: '新堂洞', labelKr: '신당동' },
          { value: 'dongdaemun', label: '东大门', labelKr: '동대문' }
        ]
      },
      {
        value: 'mapo-gu',
        label: '麻浦区',
        labelKr: '마포구',
        children: [
          { value: 'hongdae', label: '弘大', labelKr: '홍대' },
          { value: 'sinchon', label: '新村', labelKr: '신촌' },
          { value: 'hapjeong', label: '合井', labelKr: '합정' },
          { value: 'sangsu', label: '上水', labelKr: '상수' },
          { value: 'seogyo', label: '西桥洞', labelKr: '서교동' },
          { value: 'yeonnam', label: '延南洞', labelKr: '연남동' },
          { value: 'mangwon', label: '望远洞', labelKr: '망원동' },
          { value: 'daeheung', label: '大兴洞', labelKr: '대흥동' },
          { value: 'gongdeok', label: '孔德', labelKr: '공덕' },
          { value: 'ahyeon', label: '阿岘洞', labelKr: '아현동' },
          { value: 'yonggang', label: '龙江洞', labelKr: '용강동' },
          { value: 'sangam', label: '上岩洞', labelKr: '상암동' }
        ]
      },
      {
        value: 'yongsan-gu',
        label: '龙山区',
        labelKr: '용산구',
        children: [
          { value: 'itaewon', label: '梨泰院', labelKr: '이태원' },
          { value: 'hannam', label: '汉南洞', labelKr: '한남동' },
          { value: 'huam', label: '厚岩洞', labelKr: '후암동' },
          { value: 'yongsan', label: '龙山洞', labelKr: '용산동' },
          { value: 'ichon', label: '二村洞', labelKr: '이촌동' },
          { value: 'bogwang', label: '普光洞', labelKr: '보광동' },
          { value: 'seobinggo', label: '西冰库洞', labelKr: '서빙고동' },
          { value: 'dongbinggo', label: '东冰库洞', labelKr: '동빙고동' },
          { value: 'juseong', label: '铸城洞', labelKr: '주성동' },
          { value: 'wonhyo', label: '元晓洞', labelKr: '원효동' },
          { value: 'hyochang', label: '孝昌洞', labelKr: '효창동' },
          { value: 'cheongpa', label: '青坡洞', labelKr: '청파동' }
        ]
      },
      {
        value: 'seongdong-gu',
        label: '城东区',
        labelKr: '성동구',
        children: [
          { value: 'seongsu', label: '圣水洞', labelKr: '성수동' },
          { value: 'wangsimni', label: '往十里', labelKr: '왕십리' },
          { value: 'haengdang', label: '杏堂洞', labelKr: '행당동' },
          { value: 'eungbong', label: '鹰峰洞', labelKr: '응봉동' },
          { value: 'geumho', label: '金湖洞', labelKr: '금호동' },
          { value: 'oksu', label: '玉水洞', labelKr: '옥수동' },
          { value: 'majang', label: '马场洞', labelKr: '마장동' },
          { value: 'yongdap', label: '龙踏洞', labelKr: '용답동' },
          { value: 'sageun', label: '沙斤洞', labelKr: '사근동' },
          { value: 'songjeong', label: '松亭洞', labelKr: '송정동' },
          { value: 'dosun', label: '道詵洞', labelKr: '도선동' }
        ]
      },
      {
        value: 'gwangjin-gu',
        label: '广津区',
        labelKr: '광진구',
        children: [
          { value: 'konkuk', label: '建大', labelKr: '건대' },
          { value: 'guui', label: '九宜洞', labelKr: '구의동' },
          { value: 'jayang', label: '紫阳洞', labelKr: '자양동' },
          { value: 'hwayang', label: '华阳洞', labelKr: '화양동' },
          { value: 'gwangjang', label: '广壮洞', labelKr: '광장동' },
          { value: 'achasan', label: '峨嵯山', labelKr: '아차산' },
          { value: 'junggok', label: '中谷洞', labelKr: '중곡동' },
          { value: 'neung', label: '陵洞', labelKr: '능동' },
          { value: 'mojin', label: '毛陈洞', labelKr: '모진동' }
        ]
      },
      {
        value: 'seodaemun-gu',
        label: '西大门区',
        labelKr: '서대문구',
        children: [
          { value: 'sinchon-yonsei', label: '新村(延世)', labelKr: '신촌(연세)' },
          { value: 'ewha', label: '梨大', labelKr: '이대' },
          { value: 'chungjeongno', label: '忠正路', labelKr: '충정로' },
          { value: 'bukahyeon', label: '北阿岘', labelKr: '북아현' },
          { value: 'naengcheon', label: '冷泉洞', labelKr: '냉천동' },
          { value: 'yeokchon', label: '驿村洞', labelKr: '역촌동' },
          { value: 'daehyeon', label: '大岘洞', labelKr: '대현동' },
          { value: 'daeshin', label: '大新洞', labelKr: '대신동' },
          { value: 'bongwon', label: '奉元洞', labelKr: '봉원동' },
          { value: 'changcheon', label: '仓川洞', labelKr: '창천동' },
          { value: 'yeonhui', label: '延禧洞', labelKr: '연희동' },
          { value: 'hongeun', label: '弘恩洞', labelKr: '홍은동' },
          { value: 'hongje', label: '弘济洞', labelKr: '홍제동' }
        ]
      },
      {
        value: 'jongno-gu',
        label: '钟路区',
        labelKr: '종로구',
        children: [
          { value: 'gwanghwamun', label: '光化门', labelKr: '광화문' },
          { value: 'insadong', label: '仁寺洞', labelKr: '인사동' },
          { value: 'samcheong', label: '三清洞', labelKr: '삼청동' },
          { value: 'bukchon', label: '北村', labelKr: '북촌' },
          { value: 'seochon', label: '西村', labelKr: '서촌' },
          { value: 'hyehwa', label: '惠化', labelKr: '혜화' },
          { value: 'daehangno', label: '大学路', labelKr: '대학로' },
          { value: 'dongsung', label: '东崇洞', labelKr: '동숭동' },
          { value: 'ihwa', label: '梨花洞', labelKr: '이화동' },
          { value: 'jongno', label: '钟路', labelKr: '종로' },
          { value: 'gwancheol', label: '观哲洞', labelKr: '관철동' },
          { value: 'anguk', label: '安国洞', labelKr: '안국동' },
          { value: 'gahoe', label: '嘉会洞', labelKr: '가회동' },
          { value: 'pyeongchang', label: '平仓洞', labelKr: '평창동' },
          { value: 'buam', label: '付岩洞', labelKr: '부암동' },
          { value: 'seongbuk', label: '城北洞', labelKr: '성북동' }
        ]
      },
      {
        value: 'yeongdeungpo-gu',
        label: '永登浦区',
        labelKr: '영등포구',
        children: [
          { value: 'yeouido', label: '汝矣岛', labelKr: '여의도' },
          { value: 'yeongdeungpo', label: '永登浦', labelKr: '영등포' },
          { value: 'mullae', label: '文来洞', labelKr: '문래동' },
          { value: 'sindorim', label: '新道林', labelKr: '신도림' },
          { value: 'daerim', label: '大林洞', labelKr: '대림동' },
          { value: 'dangsan', label: '堂山', labelKr: '당산' },
          { value: 'yangpyeong', label: '杨坪洞', labelKr: '양평동' },
          { value: 'sinpung', label: '新丰洞', labelKr: '신풍동' },
          { value: 'dorim', label: '道林洞', labelKr: '도림동' }
        ]
      },
      {
        value: 'dongjak-gu',
        label: '铜雀区',
        labelKr: '동작구',
        children: [
          { value: 'noryangjin', label: '鹭梁津', labelKr: '노량진' },
          { value: 'sadang', label: '舍堂', labelKr: '사당' },
          { value: 'boramae', label: '普罗米', labelKr: '보라매' },
          { value: 'sanbon', label: '上本洞', labelKr: '상도동' },
          { value: 'dongjak', label: '铜雀洞', labelKr: '동작동' },
          { value: 'daebang', label: '大方洞', labelKr: '대방동' },
          { value: 'sinmae', label: '新大方洞', labelKr: '신대방동' },
          { value: 'heukseok', label: '黑石洞', labelKr: '흑석동' }
        ]
      },
      {
        value: 'gangdong-gu',
        label: '江东区',
        labelKr: '강동구',
        children: [
          { value: 'cheonho', label: '千户', labelKr: '천호' },
          { value: 'amsa', label: '岩寺洞', labelKr: '암사동' },
          { value: 'gangil', label: '江一洞', labelKr: '강일동' },
          { value: 'godeok', label: '古德洞', labelKr: '고덕동' },
          { value: 'myeongil', label: '明逸洞', labelKr: '명일동' },
          { value: 'dunchon', label: '遁村洞', labelKr: '둔촌동' },
          { value: 'sangil', label: '上一洞', labelKr: '상일동' },
          { value: 'gil', label: '吉洞', labelKr: '길동' },
          { value: 'seongnae', label: '城内洞', labelKr: '성내동' }
        ]
      },
      {
        value: 'gangbuk-gu',
        label: '江北区',
        labelKr: '강북구',
        children: [
          { value: 'suyu', label: '水逾', labelKr: '수유' },
          { value: 'mia', label: '弥阿', labelKr: '미아' },
          { value: 'beon', label: '樊洞', labelKr: '번동' },
          { value: 'ui', label: '牛耳洞', labelKr: '우이동' },
          { value: 'insu', label: '仁寿洞', labelKr: '인수동' },
          { value: 'samgak', label: '三角山洞', labelKr: '삼각산동' },
          { value: 'samyang', label: '三阳洞', labelKr: '삼양동' },
          { value: 'songcheon', label: '松泉洞', labelKr: '송천동' },
          { value: 'songchung', label: '松中洞', labelKr: '송중동' }
        ]
      },
      {
        value: 'gwanak-gu',
        label: '冠岳区',
        labelKr: '관악구',
        children: [
          { value: 'seoul-univ', label: '首尔大', labelKr: '서울대' },
          { value: 'sillim', label: '新林', labelKr: '신림' },
          { value: 'nakseongdae', label: '落星垈', labelKr: '낙성대' },
          { value: 'bongcheon', label: '奉天洞', labelKr: '봉천동' },
          { value: 'inheon', label: '仁宪洞', labelKr: '인헌동' },
          { value: 'namhyeon', label: '南岘洞', labelKr: '남현동' },
          { value: 'seowon', label: '书院洞', labelKr: '서원동' },
          { value: 'sinwon', label: '新源洞', labelKr: '신원동' },
          { value: 'seolim', label: '西林洞', labelKr: '서림동' },
          { value: 'samseong', label: '三圣洞', labelKr: '삼성동' },
          { value: 'miseong', label: '美星洞', labelKr: '미성동' },
          { value: 'nangok', label: '兰谷洞', labelKr: '난곡동' },
          { value: 'nanhyang', label: '兰香洞', labelKr: '난향동' },
          { value: 'daehak', label: '大学洞', labelKr: '대학동' },
          { value: 'euncheon', label: '银川洞', labelKr: '은천동' },
          { value: 'junggang', label: '中央洞', labelKr: '중앙동' },
          { value: 'cheongnyong', label: '青龙洞', labelKr: '청룡동' },
          { value: 'haengun', label: '幸运洞', labelKr: '행운동' },
          { value: 'cheongrim', label: '青林洞', labelKr: '청림동' },
          { value: 'seongbuk', label: '星北洞', labelKr: '성현동' },
          { value: 'wonsin', label: '元新洞', labelKr: '원신동' }
        ]
      },
      {
        value: 'nowon-gu',
        label: '芦原区',
        labelKr: '노원구',
        children: [
          { value: 'nowon', label: '芦原', labelKr: '노원' },
          { value: 'sanggye', label: '上溪', labelKr: '상계' },
          { value: 'junggye', label: '中溪', labelKr: '중계' },
          { value: 'hagye', label: '下溪', labelKr: '하계' },
          { value: 'wolgye', label: '月溪', labelKr: '월계' },
          { value: 'gongneung', label: '孔陵', labelKr: '공릉' },
          { value: 'taereung', label: '泰陵', labelKr: '태릉' },
          { value: 'madeul', label: '马得', labelKr: '마들' },
          { value: 'surak', label: '水落山', labelKr: '수락산' },
          { value: 'dongil', label: '东一路', labelKr: '동일로' }
        ]
      },
      {
        value: 'dobong-gu',
        label: '道峰区',
        labelKr: '도봉구',
        children: [
          { value: 'dobong', label: '道峰', labelKr: '도봉' },
          { value: 'ssangmun', label: '双门', labelKr: '쌍문' },
          { value: 'banghak', label: '放鹤', labelKr: '방학' },
          { value: 'chang', label: '仓洞', labelKr: '창동' },
          { value: 'dobongsan', label: '道峰山', labelKr: '도봉산' }
        ]
      },
      {
        value: 'geumcheon-gu',
        label: '衿川区',
        labelKr: '금천구',
        children: [
          { value: 'gasan', label: '加山', labelKr: '가산' },
          { value: 'doksan', label: '禿山', labelKr: '독산' },
          { value: 'siheung', label: '始兴', labelKr: '시흥' },
          { value: 'geumcheon', label: '衿川谷', labelKr: '금천구청' },
          { value: 'gasan-digital', label: '加山数码园区', labelKr: '가산디지털단지' }
        ]
      },
      {
        value: 'yangcheon-gu',
        label: '阳川区',
        labelKr: '양천구',
        children: [
          { value: 'mokdong', label: '木洞', labelKr: '목동' },
          { value: 'omok', label: '梧木桥', labelKr: '오목교' },
          { value: 'sinjeong', label: '新亭', labelKr: '신정' },
          { value: 'sinwol', label: '新月', labelKr: '신월' },
          { value: 'yangcheon', label: '阳川谷', labelKr: '양천구청' }
        ]
      },
      {
        value: 'guro-gu',
        label: '九老区',
        labelKr: '구로구',
        children: [
          { value: 'guro', label: '九老', labelKr: '구로' },
          { value: 'guro-digital', label: '九老数码园区', labelKr: '구로디지털단지' },
          { value: 'sindorim', label: '新道林', labelKr: '신도림' },
          { value: 'gaebong', label: '开峰', labelKr: '개봉' },
          { value: 'oryu', label: '梧柳', labelKr: '오류' },
          { value: 'gocheok', label: '高尺', labelKr: '고척' },
          { value: 'gungdong', label: '宫洞', labelKr: '궁동' },
          { value: 'onsu', label: '温水', labelKr: '온수' },
          { value: 'cheonwang', label: '天旺', labelKr: '천왕' },
          { value: 'hang', label: '杭洞', labelKr: '항동' }
        ]
      },
      {
        value: 'gangseo-gu',
        label: '江西区',
        labelKr: '강서구',
        children: [
          { value: 'gimpo-airport', label: '金浦机场', labelKr: '김포공항' },
          { value: 'balsan', label: '钵山', labelKr: '발산' },
          { value: 'ujangsan', label: '雨装山', labelKr: '우장산' },
          { value: 'hwagok', label: '禾谷', labelKr: '화곡' },
          { value: 'gayang', label: '加阳', labelKr: '가양' },
          { value: 'deungchon', label: '登村', labelKr: '등촌' },
          { value: 'yeomchang', label: '盐仓', labelKr: '염창' },
          { value: 'banghwa', label: '傍花', labelKr: '방화' },
          { value: 'magok', label: '麻谷', labelKr: '마곡' },
          { value: 'gonghang', label: '空港洞', labelKr: '공항동' },
          { value: 'naebalsan', label: '内钵山', labelKr: '내발산' },
          { value: 'oegok', label: '外谷', labelKr: '외발산' }
        ]
      },
      {
        value: 'eunpyeong-gu',
        label: '恩平区',
        labelKr: '은평구',
        children: [
          { value: 'eunpyeong', label: '恩平', labelKr: '은평' },
          { value: 'bulgwang', label: '佛光', labelKr: '불광' },
          { value: 'daejo', label: '大枣', labelKr: '대조' },
          { value: 'yeonsinnae', label: '延新内', labelKr: '연신내' },
          { value: 'nokbeon', label: '碌磻', labelKr: '녹번' },
          { value: 'eungam', label: '鹰岩', labelKr: '응암' },
          { value: 'jeungsan', label: '证山', labelKr: '증산' },
          { value: 'susaek', label: '水色', labelKr: '수색' },
          { value: 'jingwan', label: '津宽', labelKr: '진관' },
          { value: 'gusan', label: '龟山', labelKr: '구산' },
          { value: 'galhyeon', label: '葛岘', labelKr: '갈현' },
          { value: 'gupabal', label: '旧把拨', labelKr: '구파발' }
        ]
      },
      {
        value: 'seongbuk-gu',
        label: '城北区',
        labelKr: '성북구',
        children: [
          { value: 'seongbuk', label: '城北洞', labelKr: '성북동' },
          { value: 'hansung-univ', label: '汉城大', labelKr: '한성대' },
          { value: 'sungshin-univ', label: '诚信女大', labelKr: '성신여대' },
          { value: 'anam', label: '安岩', labelKr: '안암' },
          { value: 'korea-univ', label: '高丽大', labelKr: '고려대' },
          { value: 'bomun', label: '普门', labelKr: '보문' },
          { value: 'jeongneung', label: '贞陵', labelKr: '정릉' },
          { value: 'gil-eum', label: '吉音', labelKr: '길음' },
          { value: 'donam', label: '敦岩', labelKr: '돈암' },
          { value: 'jangwi', label: '长位', labelKr: '장위' },
          { value: 'seokgwan', label: '石串', labelKr: '석관' },
          { value: 'wolkok', label: '月谷', labelKr: '월곡' },
          { value: 'hagwol', label: '下月', labelKr: '하월곡' },
          { value: 'sangwol', label: '上月', labelKr: '상월곡' },
          { value: 'jongam', label: '钟岩', labelKr: '종암' }
        ]
      },
      {
        value: 'jungnang-gu',
        label: '中浪区',
        labelKr: '중랑구',
        children: [
          { value: 'myeonmok', label: '面牧', labelKr: '면목' },
          { value: 'junghwa', label: '中和', labelKr: '중화' },
          { value: 'muk', label: '墨洞', labelKr: '묵동' },
          { value: 'mangwoo', label: '忘忧', labelKr: '망우' },
          { value: 'sangbong', label: '上峰', labelKr: '상봉' },
          { value: 'taereung', label: '泰陵', labelKr: '태릉' },
          { value: 'sinnaeg', label: '新内', labelKr: '신내' },
          { value: 'yangwon', label: '养源', labelKr: '양원' }
        ]
      }
    ],
    services: [
      { value: 'skin', label: '皮肤管理' },
      { value: 'plastic', label: '整形手术' }
    ],
    priceRanges: [
      { value: '0-100', label: '100万韩元以下' },
      { value: '100-300', label: '100-300万韩元' }
    ]
  },
  banner_images: {
    items: [
      {
        imageUrl: '/images/banner1.jpg',
        title: '新年特惠',
        link: '/promotion',
        sortOrder: 1
      }
    ]
  },
  services: {
    items: [
      { id: 1, name: '双眼皮手术', nameKr: '쌍꺼풀 수술', category: '整形手术', description: '精细双眼皮成形术', priceRange: '150-300万韩元', duration: 60, isHot: true },
      { id: 2, name: '玻尿酸注射', nameKr: '히알루론산 주사', category: '微整形', description: '面部填充塑形', priceRange: '50-150万韩元', duration: 30, isHot: true },
      { id: 3, name: '激光美白', nameKr: '레이저 미백', category: '激光治疗', description: '改善肤色均匀度', priceRange: '80-200万韩元', duration: 45, isHot: false },
      { id: 4, name: '皮肤管理', nameKr: '피부 관리', category: '皮肤管理', description: '深层清洁保养', priceRange: '30-80万韩元', duration: 90, isHot: false }
    ]
  }
};

/**
 * 获取所有配置列表
 * GET /api/admin/config
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    // 返回所有配置
    const configs = Object.keys(configStore).map(type => ({
      type,
      content: configStore[type],
      isActive: true
    }));

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 获取组合热搜（管理员配置+算法生成）
 * GET /api/admin/config/hot-searches/combined
 */
router.get('/hot-searches/combined', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminSearches = configStore.hot_searches?.items || [];

    // 模拟算法生成的热搜
    const algorithmSearches = [
      { keyword: '隆鼻', count: 150, clickRate: 45, source: 'algorithm', isHot: true },
      { keyword: '美白针', count: 120, clickRate: 38, source: 'algorithm', isHot: false }
    ];

    res.json({
      success: true,
      data: {
        searches: [
          ...adminSearches.map(item => ({ ...item, source: 'admin' })),
          ...algorithmSearches
        ]
      }
    });
  } catch (error) {
    console.error('获取组合热搜失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热搜失败'
    });
  }
});

/**
 * 获取特定类型的配置
 * GET /api/admin/config/:type
 */
router.get('/:type', verifyToken, requireAdmin, async (req, res) => {
  try {
    const config = configStore[req.params.type];

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    res.json({
      success: true,
      data: {
        type: req.params.type,
        content: config,
        isActive: true
      }
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 创建或更新配置
 * POST /api/admin/config
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { type, name, content, isActive } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: '参数缺失'
      });
    }

    // 保存到内存中
    configStore[type] = content;

    res.json({
      success: true,
      data: {
        type,
        name,
        content,
        isActive: true
      },
      message: '配置保存成功'
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存配置失败'
    });
  }
});

/**
 * 更新配置
 * PUT /api/admin/config/:type
 */
router.put('/:type', verifyToken, requireAdmin, async (req, res) => {
  const { type } = req.params;
  const { content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '内容不能为空'
      });
    }

    configStore[type] = content;

    res.json({
      success: true,
      data: {
        type,
        content,
        isActive: true
      },
      message: '配置更新成功'
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新配置失败'
    });
  }
});

/**
 * 删除配置
 * DELETE /api/admin/config/:type
 */
router.delete('/:type', verifyToken, requireAdmin, async (req, res) => {
  const { type } = req.params;

  try {
    if (!configStore[type]) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    delete configStore[type];

    res.json({
      success: true,
      message: '配置删除成功'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除配置失败'
    });
  }
});

// 导出router和configStore，让publicConfig可以访问
module.exports = router;
module.exports.configStore = configStore;