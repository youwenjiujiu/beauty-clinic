// 共享的配置存储 - 独立文件避免循环依赖
const configStore = {
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
      }
    ],
    services: [
      { value: 'skin', label: '皮肤管理' },
      { value: 'plastic', label: '整形手术' },
      { value: 'injection', label: '微整形' },
      { value: 'laser', label: '激光提升' }
    ],
    priceRanges: [
      { value: '0-100', label: '100万韩元以下' },
      { value: '100-300', label: '100-300万韩元' },
      { value: '300-500', label: '300-500万韩元' },
      { value: '500+', label: '500万韩元以上' }
    ]
  },
  services: {
    items: [
      { id: 1, name: '双眼皮手术', nameKr: '쌍꺼풀 수술', category: '整形手术', description: '精细双眼皮成形术', priceRange: '150-300万韩元', duration: 60, isHot: true },
      { id: 2, name: '玻尿酸注射', nameKr: '히알루론산 주사', category: '微整形', description: '面部填充塑形', priceRange: '50-150万韩元', duration: 30, isHot: true },
      { id: 3, name: '激光美白', nameKr: '레이저 미백', category: '激光提升', description: '改善肤色均匀度', priceRange: '80-200万韩元', duration: 45, isHot: false },
      { id: 4, name: '皮肤管理', nameKr: '피부 관리', category: '皮肤管理', description: '深层清洁保养', priceRange: '30-80万韩元', duration: 90, isHot: false }
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
  }
};

module.exports = { configStore };