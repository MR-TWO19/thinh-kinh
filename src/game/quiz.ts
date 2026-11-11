/**
 * Câu đố né kiếp nạn: trước mỗi boss hiện 1 câu hỏi 3 đáp án 1 / 2 / 3.
 * Người xem bình luận 1, 2 hoặc 3 trong thời gian đếm ngược; đáp án nhiều người chọn nhất thắng.
 * Đúng → né được boss, đi tiếp kiếp nạn sau. Sai (hoặc không ai trả lời) → bị bắt phải đánh boss.
 * Câu hỏi tự viết dựa trên truyện Tây Du Ký (tác phẩm cổ điển).
 */

export const QUIZ_LABELS = ['1', '2', '3'] as const;

/** đáp án đầu tiên là đáp án đúng, thứ tự sẽ được xáo khi hiện ra */
const BANK: { q: string; a: [string, string, string] }[] = [
  { q: 'Tôn Ngộ Không sinh ra từ đâu?', a: ['Hòn đá trên núi Hoa Quả', 'Một đoá hoa sen', 'Trứng rồng Biển Đông'] },
  { q: 'Vũ khí của Tôn Ngộ Không là gì?', a: ['Gậy Như Ý', 'Đinh ba', 'Thiền trượng'] },
  { q: 'Vũ khí của Trư Bát Giới là gì?', a: ['Bồ cào chín răng', 'Gậy Như Ý', 'Song kiếm'] },
  { q: 'Vũ khí của Sa Tăng là gì?', a: ['Bảo trượng hàng yêu', 'Bồ cào chín răng', 'Cung tên'] },
  { q: 'Đường Tăng cưỡi con gì đi thỉnh kinh?', a: ['Bạch Long Mã', 'Kỳ lân', 'Hổ trắng'] },
  { q: 'Bạch Long Mã vốn là ai?', a: ['Tam thái tử Long Vương', 'Con trai Ngọc Hoàng', 'Thần núi Hoa Quả'] },
  { q: 'Đường thỉnh kinh có bao nhiêu kiếp nạn?', a: ['81', '72', '108'] },
  { q: 'Tôn Ngộ Không có bao nhiêu phép biến hoá?', a: ['72', '36', '81'] },
  { q: 'Kiếp trước Trư Bát Giới là ai?', a: ['Thiên Bồng Nguyên Soái', 'Quyển Liêm Đại Tướng', 'Thái Bạch Kim Tinh'] },
  { q: 'Kiếp trước Sa Tăng là ai?', a: ['Quyển Liêm Đại Tướng', 'Thiên Bồng Nguyên Soái', 'Thái Thượng Lão Quân'] },
  { q: 'Ngộ Không bị đè dưới núi nào?', a: ['Ngũ Hành Sơn', 'Hoa Quả Sơn', 'Hoả Diệm Sơn'] },
  { q: 'Ngộ Không bị đè dưới núi bao lâu?', a: ['500 năm', '100 năm', '1000 năm'] },
  { q: 'Ai đã đè Ngộ Không dưới núi?', a: ['Phật Như Lai', 'Ngọc Hoàng', 'Quan Âm Bồ Tát'] },
  { q: 'Ai trao vòng kim cô cho Đường Tăng?', a: ['Quan Âm Bồ Tát', 'Phật Như Lai', 'Thái Thượng Lão Quân'] },
  { q: 'Cân Đẩu Vân bay một lần được bao xa?', a: ['108.000 dặm', '1.000 dặm', '10.000 dặm'] },
  { q: 'Quạt Ba Tiêu là bảo bối của ai?', a: ['Thiết Phiến Công Chúa', 'Bạch Cốt Tinh', 'Nữ vương Tây Lương'] },
  { q: 'Quạt Ba Tiêu dùng để làm gì?', a: ['Dập lửa Hoả Diệm Sơn', 'Gọi mưa cứu hạn', 'Bay lên trời'] },
  { q: 'Bạch Cốt Tinh biến hoá lừa Đường Tăng mấy lần?', a: ['3 lần', '7 lần', '9 lần'] },
  { q: 'Chức đầu tiên Ngộ Không nhận trên Thiên Đình là gì?', a: ['Bật Mã Ôn', 'Tề Thiên Đại Thánh', 'Thiên Bồng Nguyên Soái'] },
  { q: 'Ngộ Không tự xưng danh hiệu gì?', a: ['Tề Thiên Đại Thánh', 'Ngọc Hoàng Đại Đế', 'Đông Hải Long Vương'] },
  { q: 'Ai dạy phép thuật cho Ngộ Không?', a: ['Bồ Đề Tổ Sư', 'Phật Như Lai', 'Thái Thượng Lão Quân'] },
  { q: 'Lò Bát Quái là của ai?', a: ['Thái Thượng Lão Quân', 'Ngọc Hoàng', 'Quan Âm Bồ Tát'] },
  { q: 'Sau khi ra khỏi lò Bát Quái, mắt Ngộ Không thành gì?', a: ['Hoả nhãn kim tinh', 'Thiên lý nhãn', 'Mắt rồng'] },
  { q: 'Hồng Hài Nhi là con của ai?', a: ['Ngưu Ma Vương', 'Long Vương', 'Bạch Cốt Tinh'] },
  { q: 'Hồng Hài Nhi giỏi phép gì nhất?', a: ['Tam muội chân hoả', 'Gọi gió', 'Tàng hình'] },
  { q: 'Yêu quái muốn ăn thịt Đường Tăng để làm gì?', a: ['Trường sinh bất lão', 'Bay được', 'Hoá thành rồng'] },
  { q: 'Thầy trò Đường Tăng đi lấy kinh ở đâu?', a: ['Tây Thiên', 'Đông Hải', 'Thiên Đình'] },
  { q: 'Đường Tăng xuất phát từ nước nào?', a: ['Đại Đường', 'Tây Lương', 'Ô Kê'] },
  { q: 'Trư Bát Giới thích nhất là gì?', a: ['Ăn và ngủ', 'Đánh nhau', 'Tụng kinh'] },
  { q: 'Đồ đệ thứ hai của Đường Tăng là ai?', a: ['Trư Bát Giới', 'Sa Tăng', 'Tôn Ngộ Không'] },
  { q: 'Sa Tăng sống ở sông nào trước khi theo thầy?', a: ['Lưu Sa Hà', 'Thông Thiên Hà', 'Hoàng Hà'] },
  { q: 'Trư Bát Giới gặp thầy ở đâu?', a: ['Cao Lão Trang', 'Hoa Quả Sơn', 'Lưu Sa Hà'] },
  { q: 'Nữ Nhi Quốc có điều gì đặc biệt?', a: ['Toàn là nữ giới', 'Toàn là yêu quái', 'Toàn là khỉ'] },
  { q: 'Ngộ Không thường cất Gậy Như Ý ở đâu?', a: ['Trong tai', 'Trong miệng', 'Trong giày'] },
  { q: 'Gậy Như Ý được lấy từ đâu?', a: ['Long cung Đông Hải', 'Thiên Đình', 'Lò Bát Quái'] },
  { q: 'Vườn đào tiên là của ai?', a: ['Vương Mẫu Nương Nương', 'Quan Âm Bồ Tát', 'Phật Như Lai'] },
  { q: 'Ngộ Không đã làm gì ở vườn đào tiên?', a: ['Ăn vụng đào tiên', 'Trồng thêm đào', 'Dâng đào cho Phật'] },
  { q: 'Đường Tăng niệm chú gì khi Ngộ Không không nghe lời?', a: ['Chú Khẩn Cô', 'Chú Đại Bi', 'Chú Lăng Nghiêm'] },
];

export interface QuizQuestion {
  question: string;
  options: [string, string, string];
  /** vị trí đáp án đúng (0 = A) */
  correct: number;
}

const shuffle = <T,>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** rút câu hỏi lần lượt, hết bộ mới lặp lại */
export class QuizDeck {
  private order: number[] = [];

  draw(): QuizQuestion {
    if (!this.order.length) this.order = shuffle(BANK.map((_, i) => i));
    const item = BANK[this.order.pop()!];
    const opts = shuffle([0, 1, 2]);
    return {
      question: item.q,
      options: opts.map((i) => item.a[i]) as [string, string, string],
      correct: opts.indexOf(0),
    };
  }
}

/**
 * Đọc lựa chọn từ một bình luận: "1", "2.", "3!!", "câu 1", "số 2", "đáp án 3", "chọn 1", "1️⃣".
 * Không nhận chữ A/B/C vì "a" rất hay gặp trong bình luận tiếng Việt thường ngày.
 * Trả về 0/1/2, hoặc -1 nếu không phải phiếu bầu.
 */
export function parseVote(text: string): number {
  const m = /^\s*(?:câu|cau|số|so|đáp\s*án|dap\s*an|chọn|chon)?\s*([123])(?!\d)/i.exec(text);
  return m ? Number(m[1]) - 1 : -1;
}
