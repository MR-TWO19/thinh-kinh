/**
 * 81 kiếp nạn (cửu cửu bát thập nhất nạn) theo tiểu thuyết Tây Du Ký.
 * Mỗi dòng: tên kiếp nạn · mô tả · boss · danh hiệu · dáng boss · bối cảnh · [đổi màu] · [boss lớn].
 * Chỉ số boss được sinh tự động và tăng dần theo thứ tự.
 */
import type { AmbientKind, BossDef, BossKind, StageDef } from './config';

type Theme = 'night' | 'dawn' | 'fire' | 'desert' | 'snow' | 'forest' | 'web' | 'gold' | 'violet' | 'roc' | 'river' | 'storm';

const THEMES: Record<Theme, { palette: StageDef['palette']; ambient?: { kind: AmbientKind; colors: string[] } }> = {
  night: {
    palette: { skyTop: '#2a1748', skyBottom: '#e0716b', mountainFar: '#5a3a73', mountainNear: '#3a2552', ground: '#4a3046', road: '#9a6a52', accent: '#c8a2ff', moon: '#ffe9d6' },
  },
  dawn: {
    palette: { skyTop: '#2a3a6a', skyBottom: '#ffb38a', mountainFar: '#6a5a8a', mountainNear: '#3a3a5a', ground: '#3a3040', road: '#a07a60', accent: '#ffd1a8', moon: '#fff2e0' },
    ambient: { kind: 'petals', colors: ['#ffd6e0', '#ffe9f0', '#ffc0d0'] },
  },
  fire: {
    palette: { skyTop: '#3a0d10', skyBottom: '#ff8a3d', mountainFar: '#9a3418', mountainNear: '#5e1c0e', ground: '#4a1e12', road: '#a3552e', accent: '#ffb347', moon: '#ffd27a' },
    ambient: { kind: 'embers', colors: ['#ffb347', '#ff7a2e', '#ffe08a'] },
  },
  desert: {
    palette: { skyTop: '#4a3410', skyBottom: '#e8b04a', mountainFar: '#8a6a2a', mountainNear: '#5a4218', ground: '#4a3a1e', road: '#b08a4e', accent: '#ffd27a', moon: '#fff0b0' },
    ambient: { kind: 'sand', colors: ['#e8c47a', '#d9a650', '#fff0c0'] },
  },
  snow: {
    palette: { skyTop: '#0e2440', skyBottom: '#7fb6d9', mountainFar: '#4a6a8a', mountainNear: '#2a4560', ground: '#2a3a4a', road: '#b9d9ee', accent: '#7fd4ff', moon: '#e6f6ff' },
    ambient: { kind: 'snow', colors: ['#ffffff', '#dff4ff'] },
  },
  forest: {
    palette: { skyTop: '#1a2a1a', skyBottom: '#9ac46a', mountainFar: '#3e6a3a', mountainNear: '#24402a', ground: '#2a3a24', road: '#8a7a52', accent: '#b6ff7a', moon: '#f2ffd6' },
    ambient: { kind: 'petals', colors: ['#9ad46a', '#c8f09a', '#6aa84a'] },
  },
  web: {
    palette: { skyTop: '#1e0e2a', skyBottom: '#c86aa8', mountainFar: '#5a2a5a', mountainNear: '#341a3a', ground: '#2e1a30', road: '#8a5a7a', accent: '#ff9ee0', moon: '#ffe0f4' },
    ambient: { kind: 'petals', colors: ['#ffb3e6', '#ffd6f0', '#ff8fd0'] },
  },
  gold: {
    palette: { skyTop: '#2a1a06', skyBottom: '#e0a030', mountainFar: '#7a5a2a', mountainNear: '#4a3416', ground: '#3a2a14', road: '#a88a52', accent: '#ffd24a', moon: '#fff2c0' },
    ambient: { kind: 'sparkles', colors: ['#ffe066', '#fff6c2'] },
  },
  violet: {
    palette: { skyTop: '#10101e', skyBottom: '#6a5aa8', mountainFar: '#3a3a6a', mountainNear: '#22223e', ground: '#1e1e2e', road: '#6a6a8a', accent: '#b0a0ff', moon: '#e8e6ff' },
    ambient: { kind: 'sparkles', colors: ['#b0a0ff', '#e8e6ff'] },
  },
  roc: {
    palette: { skyTop: '#1a0e04', skyBottom: '#ff9a2a', mountainFar: '#6a3a10', mountainNear: '#3e220a', ground: '#2e1a0a', road: '#9a6a3a', accent: '#ffcc33', moon: '#ffe9a0' },
    ambient: { kind: 'petals', colors: ['#ffcc33', '#ff9a2a', '#fff0a0'] },
  },
  river: {
    palette: { skyTop: '#0a2a3a', skyBottom: '#4ab0c8', mountainFar: '#2a6a7a', mountainNear: '#1a4450', ground: '#1e3a40', road: '#7a9a96', accent: '#5ad1ff', moon: '#e0fbff' },
    ambient: { kind: 'bubbles', colors: ['#bff4ff', '#7fd4ff'] },
  },
  storm: {
    palette: { skyTop: '#0e1414', skyBottom: '#4a6a5a', mountainFar: '#2e3e38', mountainNear: '#1c2622', ground: '#1a201c', road: '#5a6a5e', accent: '#9dffc4', moon: '#d6ffe8' },
    ambient: { kind: 'sand', colors: ['#8aa89a', '#c0d8cc'] },
  },
};

/** thông số mặc định theo dáng boss */
const ARCHETYPES: Record<BossKind, Pick<BossDef, 'icon' | 'aoeName' | 'projectile' | 'projColor' | 'minionKind' | 'debris'>> = {
  bone_demon: { icon: '💀', aoeName: 'BẠCH CỐT TRẢO', projectile: 'bone', minionKind: 'skeleton', debris: ['#f1ead8', '#c8a2ff'] },
  bull_king: { icon: '🐂', aoeName: 'LIỆT HỎA XUNG THIÊN', projectile: 'fire', minionKind: 'imp', debris: ['#ffb347', '#ff5a2a'] },
  wind_weasel: { icon: '🌪️', aoeName: 'TAM MUỘI THẦN PHONG', projectile: 'orb', projColor: '#ffd27a', minionKind: 'blob', debris: ['#e8c47a', '#ffd27a'] },
  fire_child: { icon: '🔥', aoeName: 'TAM MUỘI CHÂN HỎA', projectile: 'fire', minionKind: 'imp', debris: ['#ff6b4a', '#ffd24a'] },
  river_fish: { icon: '🐟', aoeName: 'BĂNG HÀ TRẤN THỦY', projectile: 'orb', projColor: '#7fd4ff', minionKind: 'blob', debris: ['#bfefff', '#ffb347'] },
  horned_king: { icon: '🏺', aoeName: 'HỒ LÔ THU NGƯỜI', projectile: 'orb', projColor: '#c77dff', minionKind: 'blob', debris: ['#b6ff7a', '#ffd24a'] },
  spider_queen: { icon: '🕷️', aoeName: 'BÀN TI THIÊN LA', projectile: 'orb', projColor: '#f4f0ff', minionKind: 'spiderling', debris: ['#f4f0ff', '#ff9ee0'] },
  yellow_brow: { icon: '🥁', aoeName: 'KIM NẠO PHONG ẤN', projectile: 'orb', projColor: '#ffd24a', minionKind: 'blob', debris: ['#ffd24a', '#fff6c2'] },
  six_ear: { icon: '🐒', aoeName: 'GIẢ GẬY NHƯ Ý', projectile: 'orb', projColor: '#9a7aff', minionKind: 'blob', debris: ['#b0a0ff', '#2a1a4a'] },
  golden_roc: { icon: '🦅', aoeName: 'KIM SÍ PHONG BẠO', projectile: 'orb', projColor: '#ffcc33', minionKind: 'blob', debris: ['#ffcc33', '#ffffff'] },
  tiger_demon: { icon: '🐯', aoeName: 'HỔ KHIẾU SƠN LÂM', projectile: 'orb', projColor: '#ff9a3c', minionKind: 'blob', debris: ['#ff9a3c', '#2a1a0a'] },
  dragon_king: { icon: '🐉', aoeName: 'LONG QUYỂN PHONG BA', projectile: 'orb', projColor: '#5ad1ff', minionKind: 'blob', debris: ['#5ad1ff', '#bff4ff'] },
  bandit: { icon: '🗡️', aoeName: 'LOẠN ĐAO CHÉM', projectile: 'orb', projColor: '#e6e8f0', minionKind: 'skeleton', debris: ['#e6e8f0', '#8a2a1a'] },
  taoist: { icon: '☯️', aoeName: 'HÔ PHONG HOÁN VŨ', projectile: 'orb', projColor: '#9dffc4', minionKind: 'blob', debris: ['#9dffc4', '#ffffff'] },
};

type Row = [name: string, subtitle: string, boss: string, title: string, kind: BossKind, theme: Theme, hue?: number, major?: boolean];

// prettier-ignore
const ROWS: Row[] = [
  ['Kim Thiền bị đày', 'Trưởng lão Kim Thiền giáng trần chịu kiếp', 'Tâm Ma Kiêu Mạn', 'Ma của lòng kiêu ngạo', 'bone_demon', 'dawn', 180],
  ['Xuất thai suýt bị giết', 'Giặc Lưu Hồng hại cha, cướp mẹ', 'Lưu Hồng', 'Tên giặc đội lốt quan', 'bandit', 'dawn'],
  ['Đầy tháng bị thả sông', 'Hài nhi trôi theo dòng nước', 'Hà Yêu', 'Yêu quái dòng sông', 'river_fish', 'river', 120],
  ['Tìm mẹ báo oán', 'Đòi lại công đạo cho song thân', 'Lý Bưu', 'Tòng phạm của Lưu Hồng', 'bandit', 'dawn', 40],
  ['Ra thành gặp hổ', 'Vừa rời Trường An đã gặp mãnh hổ', 'Dần Tướng Quân', 'Hổ tinh núi Song Xoa', 'tiger_demon', 'forest'],
  ['Sa hố mất tùy tùng', 'Hai người hầu bị yêu ăn thịt', 'Hùng Sơn Quân', 'Gấu tinh', 'tiger_demon', 'night', 200],
  ['Núi Song Xoa', 'Đường núi hiểm trở, yêu thú rình rập', 'Đặc Xử Sĩ', 'Trâu tinh', 'bull_king', 'night', 160],
  ['Núi Lưỡng Giới', 'Gặp mãnh hổ trước khi cứu Ngộ Không', 'Mãnh Hổ Lưỡng Giới', 'Chúa sơn lâm', 'tiger_demon', 'dawn'],
  ['Khe Ưng Sầu đổi ngựa', 'Bạch Long nuốt mất ngựa trắng', 'Tiểu Bạch Long', 'Tam thái tử Tây Hải', 'dragon_king', 'river'],
  ['Đêm bị lửa thiêu', 'Lão tăng tham áo cà sa phóng hỏa', 'Kim Trì Trưởng Lão', 'Lão tăng tham lam', 'taoist', 'fire', 300],
  ['Mất áo cà sa', 'Hắc Hùng Tinh đoạt bảo y', 'Hắc Hùng Tinh', 'Gấu đen núi Hắc Phong', 'tiger_demon', 'storm', 210],
  ['Cao Lão Trang', 'Trang trại có rể là yêu', 'Yêu Phong Cao Lão Trang', 'Gió yêu nổi trong đêm', 'horned_king', 'dawn', 280],
  ['Hoàng Phong Quái cản đường', 'Gió vàng thổi mù mắt', 'Hoàng Phong Quái', 'Chồn vàng thổi gió', 'wind_weasel', 'desert'],
  ['Cầu Linh Cát Bồ Tát', 'Mượn Định Phong Đan trừ gió', 'Hổ Tiên Phong', 'Tiên phong của Hoàng Phong Quái', 'tiger_demon', 'desert'],
  ['Lưu Sa khó vượt', 'Sông cát tám trăm dặm', 'Quái Lưu Sa', 'Thủy quái sông cát', 'river_fish', 'desert', 200],
  ['Thu phục Sa Tăng', 'Yêu quái sông Lưu Sa', 'Yêu Tăng Lưu Sa', 'Kẻ đeo chuỗi đầu lâu', 'bone_demon', 'desert', 90],
  ['Tứ Thánh thử lòng', 'Bốn vị Bồ Tát hóa mỹ nhân thử thiền tâm', 'Tâm Ma Sắc Dục', 'Ảo ảnh mê lòng', 'bone_demon', 'web', 300],
  ['Ngũ Trang Quán', 'Đạo quán của Trấn Nguyên Tử', 'Đạo Đồng Thanh Phong', 'Tiểu đồng giữ quán', 'taoist', 'forest'],
  ['Khó cứu cây Nhân Sâm', 'Đổ cây quả thần, bị Trấn Nguyên giữ lại', 'Trấn Nguyên Đại Tiên', 'Tổ của địa tiên', 'taoist', 'gold', 40, true],
  ['Tam đả Bạch Cốt Tinh', 'Ba lần đánh yêu, một lần bị đuổi', 'Bạch Cốt Tinh', 'Yêu nữ xương trắng', 'bone_demon', 'night', 0, true],
  ['Lạc rừng Hắc Tùng', 'Một mình Đường Tăng giữa rừng thông đen', 'Hoàng Bào Quái', 'Yêu quái áo vàng', 'horned_king', 'storm', 260],
  ['Đưa thư nước Bảo Tượng', 'Mang thư công chúa về triều', 'Phò Mã Yêu', 'Hoàng Bào Quái đội lốt người', 'horned_king', 'gold', 100],
  ['Kim điện hóa hổ', 'Đường Tăng bị yêu thuật biến thành hổ', 'Hổ Ảo Ảnh', 'Yêu thuật của Hoàng Bào', 'tiger_demon', 'violet', 260],
  ['Núi Bình Đỉnh gặp ma', 'Ngân Giác chặn đường', 'Ngân Giác Đại Vương', 'Em của Kim Giác', 'horned_king', 'forest', 160],
  ['Động Liên Hoa treo người', 'Hồ lô gọi tên là thu người', 'Kim Giác Đại Vương', 'Chủ Liên Hoa Động', 'horned_king', 'forest', 0, true],
  ['Cứu vua nước Ô Kê', 'Hồn vua báo mộng giữa đêm', 'Thanh Mao Sư Tử', 'Sư tử lông xanh giả vua', 'tiger_demon', 'gold', 140],
  ['Yêu quái biến hình', 'Kẻ giả vua ngồi trên ngai', 'Giả Quốc Vương', 'Sư tử hóa người', 'bandit', 'gold', 140],
  ['Núi Hiệu gặp ma', 'Hồng Hài Nhi giả làm trẻ lạc', 'Hồng Hài Nhi', 'Thánh Anh Đại Vương', 'fire_child', 'fire'],
  ['Gió cuốn sư phụ', 'Đường Tăng bị bắt về Hỏa Vân Động', 'Hồng Hài Nhi · Hỏa Xa', 'Năm xe lửa bao vây', 'fire_child', 'fire', 330],
  ['Tâm viên bị hại', 'Ngộ Không trúng lửa Tam Muội', 'Ngũ Kiện Tướng', 'Năm thuộc hạ Hỏa Vân Động', 'bandit', 'fire'],
  ['Thỉnh Thánh hàng yêu', 'Quan Âm thu phục Hồng Hài Nhi', 'Hồng Hài Nhi · Cuồng Hỏa', 'Cơn giận cuối cùng', 'fire_child', 'gold', 30, true],
  ['Sông Hắc Thủy chìm thuyền', 'Đà Long kéo thuyền xuống đáy', 'Đà Long', 'Thủy quái sông Hắc Thủy', 'dragon_king', 'storm', 200],
  ['Kéo xe nước Xa Trì', 'Tăng nhân bị bắt làm nô dịch', 'Hổ Lực Đại Tiên', 'Quốc sư hổ tinh', 'taoist', 'desert', 20],
  ['Đánh cược thắng thua', 'Đấu phép cầu mưa, ngồi thiền', 'Lộc Lực Đại Tiên', 'Quốc sư hươu tinh', 'taoist', 'storm', 80],
  ['Trừ đạo hưng tăng', 'Phá tà đạo, cứu tăng chúng', 'Dương Lực Đại Tiên', 'Quốc sư dê tinh', 'taoist', 'gold', 180],
  ['Đường gặp sông lớn', 'Sông Thông Thiên chắn lối', 'Thủy Tộc Thông Thiên', 'Tiên phong dưới nước', 'river_fish', 'river', 60],
  ['Rơi xuống sông Thông Thiên', 'Mặt băng vỡ dưới chân', 'Linh Cảm Đại Vương', 'Cá vàng thành tinh', 'river_fish', 'snow', 0, true],
  ['Ngư Lam hiện thân', 'Quan Âm dùng giỏ cá thu yêu', 'Linh Cảm · Cuồng Thủy', 'Cơn giận dưới đáy sông', 'river_fish', 'river', 300],
  ['Núi Kim Đâu gặp yêu', 'Vòng Kim Cang thu mọi binh khí', 'Độc Giác Hủy Vương', 'Tê giác một sừng', 'bull_king', 'violet', 180],
  ['Thiên thần khó hàng', 'Thiên binh cũng bị thu vũ khí', 'Độc Giác · Kim Cang Trác', 'Vòng bảo thu vạn vật', 'bull_king', 'gold', 220],
  ['Hỏi Phật gốc gác', 'Lão Quân đến thu trâu xanh', 'Thanh Ngưu Tinh', 'Trâu xanh của Lão Quân', 'bull_king', 'violet', 120, true],
  ['Uống nước có thai', 'Nước sông Tử Mẫu', 'Như Ý Chân Tiên', 'Kẻ giữ giếng Lạc Thai', 'taoist', 'dawn', 260],
  ['Nữ Nhi Quốc lưu hôn', 'Nữ vương muốn giữ ngự đệ', 'Tâm Ma Tình Ái', 'Ảo mộng nhân gian', 'bone_demon', 'web', 320],
  ['Động Tỳ Bà đau đớn', 'Bọ cạp tinh chích độc', 'Tỳ Bà Tinh', 'Bọ cạp ngàn năm', 'spider_queen', 'desert', 40],
  ['Lại đuổi Tâm Viên', 'Ngộ Không đánh cướp, bị đuổi lần hai', 'Sơn Tặc Đầu Lĩnh', 'Bọn cướp đường', 'bandit', 'dawn'],
  ['Chân giả Mỹ Hầu Vương', 'Hai Ngộ Không, ai thật ai giả?', 'Lục Nhĩ Mi Hầu', 'Ngộ Không giả sáu tai', 'six_ear', 'violet', 0, true],
  ['Hỏa Diệm Sơn chặn đường', 'Lửa ngút tám trăm dặm', 'Hỏa Linh', 'Lửa không bao giờ tắt', 'fire_child', 'fire', 20],
  ['Cầu quạt Ba Tiêu', 'Thiết Phiến Công Chúa không cho mượn quạt', 'La Sát Nữ', 'Thiết Phiến Công Chúa', 'bone_demon', 'fire', 160],
  ['Thu phục Ma Vương', 'Ngưu Ma Vương ra tay', 'Ngưu Ma Vương', 'Đại Lực Vương', 'bull_king', 'fire', 0, true],
  ['Quét tháp nước Tế Tái', 'Bảo tháp mất ngọc xá lợi', 'Cửu Đầu Trùng', 'Phò mã chín đầu', 'golden_roc', 'river', 240],
  ['Lấy bảo cứu tăng', 'Đoạt lại xá lợi cho chùa Kim Quang', 'Vạn Thánh Long Vương', 'Rồng hồ Bích Ba', 'dragon_king', 'river', 300],
  ['Rừng Kinh Cức ngâm thơ', 'Thụ tinh mời làm thơ', 'Thập Bát Công', 'Tùng tinh ngàn năm', 'taoist', 'forest', 100],
  ['Tiểu Lôi Âm gặp nạn', 'Chùa giả Phật giả', 'Hoàng Mi Đại Vương', 'Phật giả mày vàng', 'yellow_brow', 'gold'],
  ['Thiên thần bị khốn', 'Túi nhân chủng thu cả thiên binh', 'Hoàng Mi · Túi Nhân Chủng', 'Kẻ nuốt cả trời', 'yellow_brow', 'violet', 300, true],
  ['Ngõ Hy Thị hôi thối', 'Hồng thị nát chắn kín đường', 'Mãng Xà Tinh', 'Trăn khổng lồ Thất Tuyệt Sơn', 'dragon_king', 'forest', 90],
  ['Nước Chu Tử hành y', 'Ngộ Không bắt mạch cho vua', 'Bệnh Ma', 'Tâm bệnh của quốc vương', 'bone_demon', 'night', 100],
  ['Cứu vua khỏi bệnh', 'Vương hậu bị yêu bắt mất', 'Sài Thái Tuế', 'Hống tinh đoạt vương hậu', 'tiger_demon', 'fire', 300],
  ['Hàng yêu đoạt hậu', 'Chuông tử kim phun lửa, khói, cát', 'Sài Thái Tuế · Tử Kim Linh', 'Ba chuông pháp bảo', 'tiger_demon', 'desert', 320],
  ['Bàn Ti Động bảy nhện', 'Tơ nhện giăng kín lối', 'Nhện Tinh', 'Chúa Bàn Ti Động', 'spider_queen', 'web', 0, true],
  ['Đa Mục gây hại', 'Đạo sĩ trăm mắt hạ độc', 'Bách Nhãn Ma Quân', 'Rết tinh nghìn mắt', 'taoist', 'web', 280],
  ['Sư Đà Lĩnh chặn đường', 'Ba ma vương trấn giữ núi', 'Thanh Sư Đại Vương', 'Sư tử xanh', 'tiger_demon', 'roc', 160],
  ['Yêu quái chia ba màu', 'Sư - Tượng - Bằng hợp sức', 'Bạch Tượng Đại Vương', 'Voi trắng vòi dài', 'bull_king', 'roc', 260],
  ['Trong thành gặp nạn', 'Thành Sư Đà toàn yêu quái', 'Yêu Binh Sư Đà', 'Đạo quân yêu', 'bandit', 'roc', 260],
  ['Thỉnh Phật thu ma', 'Như Lai thu phục Đại Bằng', 'Kim Sí Đại Bằng', 'Vua chim cánh vàng', 'golden_roc', 'roc', 0, true],
  ['Nước Tỳ Khâu cứu trẻ', 'Quốc trượng đòi tim trẻ con', 'Bạch Lộc Tinh', 'Quốc trượng hươu trắng', 'taoist', 'dawn', 200],
  ['Phân biệt tà chính', 'Vạch mặt yêu quốc trượng', 'Bạch Diện Hồ Ly', 'Mỹ hậu hồ ly', 'bone_demon', 'night', 40],
  ['Rừng tùng cứu quái', 'Nữ yêu giả bị trói cầu cứu', 'Địa Dũng Phu Nhân', 'Chuột trắng mũi vàng', 'bone_demon', 'forest', 260],
  ['Tăng phòng nằm bệnh', 'Đường Tăng lâm bệnh giữa đường', 'Bệnh Ma Lam Nhược', 'Cơn sốt ma quái', 'bone_demon', 'storm', 140],
  ['Động Không Đáy gặp nạn', 'Chuột tinh muốn thành thân', 'Kim Tỵ Bạch Mao Thử', 'Chuột tinh động không đáy', 'wind_weasel', 'night', 200, true],
  ['Nước Diệt Pháp khó đi', 'Vua thề giết đủ vạn tăng', 'Ngự Lâm Quân Diệt Pháp', 'Lính của vua diệt pháp', 'bandit', 'gold', 200],
  ['Núi Ẩn Vụ gặp ma', 'Báo tinh bày kế phân hoa', 'Nam Sơn Đại Vương', 'Báo tinh núi Ẩn Vụ', 'tiger_demon', 'storm', 30],
  ['Phượng Tiên Quận cầu mưa', 'Ba năm hạn hán', 'Hạn Bạt', 'Quỷ hạn hán', 'fire_child', 'desert', 90],
  ['Mất binh khí', 'Ba binh khí bị trộm ở Ngọc Hoa', 'Hoàng Sư Tinh', 'Sư tử vàng trộm bảo', 'tiger_demon', 'gold', 20],
  ['Hội Đinh Ba', 'Yêu quái mở hội mừng binh khí', 'Cửu Linh Nguyên Thánh', 'Sư tử chín đầu', 'tiger_demon', 'violet', 240],
  ['Núi Trúc Tiết gặp nạn', 'Cửu Đầu Sư bắt cả đoàn', 'Cửu Linh · Cuồng Sư', 'Tổ của loài sư tử', 'tiger_demon', 'night', 280, true],
  ['Động Huyền Anh gặp nạn', 'Ba yêu tê giác giả Phật', 'Tịch Hàn Đại Vương', 'Tê giác tránh rét', 'bull_king', 'snow', 190],
  ['Bắt tê giác', 'Tứ Mộc Cầm Tinh truy đuổi', 'Tịch Trần Đại Vương', 'Tê giác tránh bụi', 'bull_king', 'snow', 60],
  ['Thiên Trúc bị ép làm rể', 'Công chúa giả tung tú cầu', 'Ngọc Thố Tinh', 'Thỏ ngọc cung trăng', 'wind_weasel', 'dawn', 260],
  ['Nhà họ Khấu gặp tù', 'Bị vu oan cướp của', 'Cường Đạo Đồng Đài', 'Bọn cướp phủ Đồng Đài', 'bandit', 'night', 30],
  ['Lăng Vân Độ thoát xác', 'Thuyền không đáy rũ bỏ phàm thai', 'Phàm Thai Tâm Ma', 'Xác cũ níu chân', 'bone_demon', 'gold', 0],
  ['Sông Thông Thiên lật thuyền', 'Lão Ngoan Quy hất kinh xuống nước', 'Lão Ngoan Quy', 'Rùa già sông Thông Thiên', 'river_fish', 'river', 150, true],
];

function buildStage(row: Row, i: number): StageDef {
  const [name, subtitle, bossName, title, kind, theme, hue = 0, major = false] = row;
  const n = i + 1;
  const m = 1 + i * 0.008; // hệ số sát thương tăng dần
  const hp = Math.round(((2600 + i * 150) * (major ? 1.3 : 1)) / 100) * 100;
  const t = THEMES[theme];
  return {
    id: `kiep-nan-${n}`,
    index: n,
    name,
    subtitle,
    palette: t.palette,
    ambient: t.ambient,
    boss: {
      kind,
      name: bossName,
      title,
      hue: hue || undefined,
      ...ARCHETYPES[kind],
      maxHp: hp,
      attackInterval: Math.max(2.2, 3.4 - i * 0.015),
      damage: [Math.round(18 * m), Math.round(32 * m)],
      aoeEvery: 4,
      aoeDamage: Math.round(26 * m),
      summonEvery: kind === 'spider_queen' ? 4 : 5,
      minionHp: Math.round(40 + i * 0.5),
      minionDamage: Math.round(7 * m),
      maxMinions: kind === 'spider_queen' ? 5 : 4,
    },
  };
}

export const STAGES: StageDef[] = ROWS.map(buildStage);
