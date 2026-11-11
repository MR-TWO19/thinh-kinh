# Thỉnh Kinh Online — prototype web cho TikTok LIVE

Web app khung dọc 9:16 (React + TypeScript + Vite, vẽ bằng Canvas 2D + HTML/CSS). Không dùng Unity. Có thể nhận tim / quà thật từ TikTok LIVE qua relay Node dùng thư viện không chính thức `tiktok-live-connector` (xem mục **Kết nối TikTok LIVE**).

## Chạy app

Cần Node.js 18 trở lên.

```bash
npm install
```

```bash
npm run dev
```

Mở `http://localhost:5173`. Click vào trang một lần để trình duyệt cho phép phát âm thanh.

| URL | Hiển thị |
| --- | --- |
| `http://localhost:5173/` | Sân khấu + bảng điều khiển cạnh nhau (để thử) |
| `http://localhost:5173/?view=stage` | Chỉ sân khấu 9:16, dùng cửa sổ này để capture |
| `http://localhost:5173/?view=panel` | Chỉ bảng điều khiển; điều khiển cửa sổ sân khấu qua BroadcastChannel |

Bản build tĩnh: `npm run build` sẽ tạo thư mục `dist/`, chạy thử bằng `npm run preview`.

### Phím tắt (khi bảng điều khiển đang mở)

| Phím | Tác dụng |
| --- | --- |
| `Q` | Thả 1 tim |
| `A` | Ngộ Không · Gậy Như Ý (quà Hoa Sen) |
| `S` | Sa Tăng · Khiên (quà Chuông Đồng) |
| `D` | Bát Giới · Địa Chấn (quà Đào Tiên) |
| `F` | Ngộ Không · Tuyệt chiêu phân thân (quà Cân Đẩu Vân) |
| `Z` | Sa Tăng · Nguyệt Nha Phi Trảm (quà Tràng Hạt) |
| `X` | Bát Giới · Thiên Bồng Giáng Thế (quà Bánh Bao) |
| `C` | Đường Tăng · Kim Cang Chú định thân boss (quà Kinh Thư) |
| `V` | **Thầy trò hợp kích**: hạ boss ngay (quà Liên Đài Phật Quang) |
| `M` / `J` / `B` / `R` | 30 tim · người xem mới · boss tấn công · bắt đầu lại màn |

Số lượng quà mỗi lần bấm theo nút x1/x5/x10 đang chọn. Giữ phím không bị lặp. Phím tắt cũng dùng được trong cửa sổ `?view=stage` (mỗi lần 1 quà); click vào cửa sổ đó trước để nó nhận phím.

## Cách chơi

- **Tim** nạp năng lượng cho Đường Tăng (mặc định mỗi tim +2, đầy là 100). Khi thanh đầy, Đường Tăng hồi 40% máu cho cả đội và hồi sinh đệ tử bị gục.
- **Quà** kích hoạt chiêu thức. Mỗi nhân vật có 2 chiêu. Tặng nhiều quà một lần thì chiêu đánh nhiều lần hơn hoặc mạnh hơn:

| Nhân vật | Chiêu | Kích hoạt bằng | Tác dụng |
| --- | --- | --- | --- |
| Đường Tăng | Phật Quang Phổ Chiếu | Tim (nạp đầy thanh) | Hồi 40% máu cả đội, hồi sinh đệ tử bị gục |
| Đường Tăng | Kim Cang Chú · Định Thân | Kinh Thư (30 xu) | Boss đứng im 6 giây và nhận thêm 50% sát thương |
| Ngộ Không | Gậy Như Ý | Hoa Sen (1 xu) | Đánh một mục tiêu |
| Ngộ Không | Thân Ngoại Thân | Cân Đẩu Vân (99 xu) | Phân thân đánh dồn dập |
| Bát Giới | Địa Chấn | Đào Tiên (10 xu) | Đánh diện rộng, quét sạch lâu la |
| Bát Giới | Thiên Bồng Giáng Thế | Bánh Bao (20 xu) | Bay lên rồi nện xuống đầu boss |
| Sa Tăng | Kim Cang Hộ Thể | Chuông Đồng (5 xu) | Khiên chặn 70% sát thương trong 10 giây, hồi nhẹ máu |
| Sa Tăng | Nguyệt Nha Phi Trảm | Tràng Hạt (70 xu, quà Single Strike) | Phóng trăng khuyết xuyên qua lâu la trúng boss |

- **Chiêu đặc biệt · Thầy Trò Hợp Kích** (quà Liên Đài Phật Quang, 2000 xu): màn hình tối lại, cả đội hồi đầy máu, rồi lần lượt Đường Tăng định thân boss, Sa Tăng phóng 3 trăng khuyết, Bát Giới giáng thế, Ngộ Không phân thân vây đánh, cuối cùng một cây gậy Như Ý khổng lồ từ trời nện xuống và **hạ boss ngay**. Cả combo kéo dài khoảng 4 giây. Tặng nhiều quà một lần thì mỗi quà dư hạ boss của kiếp nạn kế tiếp.

- **Ô Hợp Kích** (ngay dưới chân nhân vật) ghi rõ 2 cách để dùng chiêu:
  1. Tặng quà Hợp Kích (từ 2000 xu, hình quà hiện bên trái ô): hợp kích ngay.
  2. Tích xu: mọi quà khác đều cộng xu vào thanh chung, theo giá quà nhân số lượng. Đủ 2000 xu thì thanh đứng ở mức đầy (không cộng thêm) và tự hợp kích khi có boss. Thanh chỉ về 0 sau khi hợp kích được dùng.

  Mốc 2000 lấy từ giá quà Hợp Kích trong `GIFTS`.

  Hợp Kích không bao giờ bị phí. Nếu boss đã chết (hoặc bị chiêu khác đánh chết trước khi gậy khổng lồ kịp nện xuống), hoặc đang có một Hợp Kích khác diễn ra, thì Hợp Kích được để dành và tự dùng ngay khi boss kế tiếp xuất hiện. Ô Hợp Kích hiện "để dành xN" để người xem biết.
- **Cho người xem biết tặng gì:** mỗi thẻ nhân vật hiện giá xu và tên 2 chiêu, ví dụ "1 xu Gậy · 99 xu Phân thân". Thanh Đường Tăng hiện "❤ Tim: Hồi máu" và chiêu định thân. Khi phòng im khoảng 12 giây, nhân vật lần lượt nói bong bóng nhắc quà, ví dụ "Cho lão Trư 10 xu, ta nện Địa Chấn!". Câu nhắc nằm ở trường `nudge` trong `SKILLS` (`config.ts`).
- Boss tấn công theo chu kỳ, cứ vài đòn lại tung một chiêu đánh cả đội, gọi lâu la, và nổi giận khi còn dưới 50% máu.
- Khi tổng máu của đội dưới 30%: viền đỏ nhấp nháy, hiện dòng cảnh báo và phát chuông báo động.
- Khi cả 3 đệ tử đều gục, đoàn chuyển sang trạng thái "kiệt sức": boss ngừng đánh và chờ người xem thả tim hoặc tặng quà để hồi sinh đội.
- Khi hạ boss, đoàn đi tiếp sang kiếp nạn sau. Qua kiếp nạn cuối thì đến **chùa Như Lai** và hiện bảng tổng kết kèm top người đóng góp.

## Cấu trúc

```
server/
  relay.ts        # relay Node: tiktok-live-connector → WebSocket 127.0.0.1:8787
src/
  events/
    types.ts      # LiveEvent: viewer_join | like | gift | debug_*
    bus.ts        # EventBus: kênh sự kiện dùng chung + BroadcastChannel giữa các cửa sổ
    sources.ts    # interface LiveEventSource + SimulatorSource (bảng thử nghiệm)
    tiktokSource.ts   # nguồn TikTok: nghe relay qua WebSocket
    relayProtocol.ts  # định dạng tin nhắn relay ↔ trang web
  game/
    config.ts     # nhân vật, quà→chiêu, boss, kiếp nạn, số liệu cân bằng
    engine.ts     # logic game: pha, máu, năng lượng, kỹ năng, boss, hiệu ứng
    render.ts     # vẽ Canvas: cảnh, nhân vật, boss, hạt, chùa
    audio.ts      # âm thanh tổng hợp bằng Web Audio (không dùng file có bản quyền)
  components/
    Stage.tsx     # canvas 9:16 + vòng lặp requestAnimationFrame
    Hud.tsx       # HUD dạng DOM (chữ sắc nét khi capture)
    ControlPanel.tsx
```

**81 kiếp nạn** (cửu cửu bát thập nhất nạn) theo thứ tự trong truyện, từ "Kim Thiền bị đày" đến "Sông Thông Thiên lật thuyền". Danh sách nằm trong `src/game/journey.ts`, mỗi dòng gồm tên kiếp nạn, boss, dáng boss, bối cảnh và màu.

- 14 dáng boss: Bạch Cốt Tinh, Ngưu Ma Vương, chồn, Hồng Hài Nhi, cá, Kim Giác, nhện, Hoàng Mi, Lục Nhĩ, Đại Bằng, hổ, rồng, sơn tặc, đạo sĩ. Boss dùng chung dáng được đổi màu (`hue`) để trông khác nhau.
- 12 bối cảnh, mỗi bối cảnh có màu trời và hiệu ứng không khí riêng.
- Chỉ số boss tăng dần: máu từ 2.600 (kiếp 1) đến khoảng 19.000 (kiếp 81). 14 kiếp nạn lớn (Bạch Cốt Tinh, Ngưu Ma Vương, Kim Sí Đại Bằng…) có thêm 30% máu.
- **Nhớ tiến độ:** game lưu kiếp nạn đang dở trong trình duyệt, nên tải lại trang hoặc buổi live sau sẽ đi tiếp. Muốn chơi lại từ đầu: chọn kiếp nạn 1 ở ô **⏭ Nhảy đến**. Đến chùa Như Lai thì tiến độ tự về kiếp nạn 1.

**Tua nhanh khi dev:** trong console, `__tkEngine.tick(5)` chạy nhanh 5 giây game (chỉ có ở `npm run dev`).

**Thêm / sửa kiếp nạn:** sửa một dòng trong `ROWS` của `src/game/journey.ts`. Dáng boss mới: thêm `BossKind` trong `config.ts`, một mục trong `ARCHETYPES` (journey.ts) và một mục `LOOKS` trong `src/game/bosses.ts`.

**Thêm nguồn sự kiện khác** (ví dụ API chính thức sau này): viết một class `implements LiveEventSource` như `TikTokRelaySource`, chuyển dữ liệu về `LiveEvent` rồi gọi `eventBus.emit(event, 'live')`. Game và HUD không cần sửa gì. Không tạo tim/quà giả.

## Kết nối TikTok LIVE

Game nhận sự kiện thật qua một relay Node nhỏ (`server/relay.ts`). Relay dùng thư viện **không chính thức** [`tiktok-live-connector`](https://www.npmjs.com/package/tiktok-live-connector) để nghe kênh đang live, rồi đẩy sang trang web qua WebSocket `ws://127.0.0.1:8787` (chỉ trong máy).

```bash
npm run relay
```

1. Chạy `npm run dev` ở một terminal và `npm run relay` ở terminal khác. Cần Node.js 20 trở lên.
2. Bắt đầu live trên TikTok trước.
3. Trong bảng điều khiển, ô **TikTok LIVE** nhập tên kênh (ví dụ `@tenkenh`) rồi bấm **Kết nối**. Chấm xanh "Đã kết nối" là xong. Hoặc chạy thẳng `npm run relay -- tenkenh` để relay tự kết nối.
4. Mở cửa sổ `?view=stage` để capture. Mỗi cửa sổ sân khấu tự nhận sự kiện từ relay, nên **OBS Browser Source cũng dùng được**.

Ánh xạ sự kiện:

| TikTok | Trong game |
| --- | --- |
| Người vào live | Thông báo gia nhập + danh sách đồng hành |
| Tim | Nạp năng lượng Đường Tăng |
| Quà | Chọn quà trong game có giá xu cao nhất mà không vượt giá quà thật (`giftForCoins` trong `config.ts`) |

Theo giá xu của quà thật: 1–2 xu → Gậy Như Ý · 3–4 → Nguyệt Nha · 5–9 → Khiên · 10–19 → Địa Chấn · 20–29 → Giáng Thế · 30–98 → Định Thân · 99–1999 → Phân Thân · **từ 2000 xu → Thầy Trò Hợp Kích**. Muốn đổi mốc thì sửa `coins` trong `GIFTS`.

**Hình và tên quà thật:** khi kết nối, relay tải bảng quà của phòng live. Game chọn cho mỗi chiêu một quà thật có giá rơi đúng mốc, rồi hiện icon quà đó thay cho số xu trên thẻ nhân vật, kèm trong thông báo quà và bong bóng nhắc. Bảng điều khiển liệt kê quà nào đang gắn với chiêu nào. Bảng quà được lưu lại, lần sau mở game chưa kết nối vẫn còn. Muốn chọn quà khác cho một chiêu, sửa tên trong `PREFERRED_GIFTS` ở `src/game/realGifts.ts`. Chiêu nào không có quà thật khớp mốc giá thì bị ẩn khỏi màn hình. Chưa kết nối lần nào thì màn hình chỉ hiện giá xu.

Quà dạng chuỗi (như Hoa hồng bấm liên tục) chỉ được tính khi chuỗi kết thúc, với tổng số lượng. Bảng nhật ký hiện tên quà thật, ví dụ `Rose → Hoa Sen x3`.

> **Lưu ý:** đây không phải API chính thức của TikTok. Điều khoản TikTok không cho phép thu thập dữ liệu tự động nếu chưa được đồng ý, nên có thể ảnh hưởng tài khoản. Thư viện có thể hỏng khi TikTok đổi hệ thống. Relay gửi tên kênh tới máy chủ ký của bên thứ ba (Euler Stream). Không cần mật khẩu hay cookie. Nếu có API key Euler Stream thì đặt biến môi trường `EULER_API_KEY` trước khi chạy relay. Chỉ dùng cho kênh của chính bạn.

## Capture khi livestream

Sân khấu được vẽ theo tỉ lệ 9:16 và tự co giãn theo cửa sổ.

### OBS Studio (khuyên dùng)

1. Mở `http://localhost:5173/?view=stage` trong một cửa sổ Chrome riêng. Kéo cửa sổ cho cao để sân khấu đủ nét, ví dụ khoảng 608×1080.
2. Mở `http://localhost:5173/?view=panel` ở một cửa sổ khác để điều khiển. Hai cửa sổ phải cùng trình duyệt và cùng profile.
3. Trong OBS, vào **Settings → Video** và đặt Base/Output resolution là **1080×1920** (dọc).
4. Thêm nguồn **Window Capture** (macOS: *macOS Screen Capture → Window*) rồi chọn cửa sổ sân khấu.
5. Chuột phải nguồn → **Transform → Fit to screen**. Nếu còn viền đen, giữ Option/Alt và kéo cạnh để crop.
6. Âm thanh: thêm **Application Audio Capture** cho Chrome (Windows), hoặc trên macOS dùng *macOS Screen Capture* có bật capture âm thanh.

> Không thu nhỏ (minimize) cửa sổ sân khấu. Khi cửa sổ bị ẩn, Chrome tạm dừng hoạt ảnh. Có thể để cửa sổ ở màn hình phụ hoặc phía sau cửa sổ khác, miễn là không minimize.

Cách khác là dùng **Browser Source** của OBS với URL `http://localhost:5173/?view=stage`, Width 1080, Height 1920. Nguồn này nhận được sự kiện TikTok thật qua relay, nhưng **không nhận** nút bấm thử từ bảng điều khiển mở trong Chrome (hai trình duyệt khác nhau).

### TikTok LIVE Studio

1. Chọn chế độ khung **dọc (Portrait)**.
2. Thêm nguồn **Window Capture** (Chụp cửa sổ) và chọn cửa sổ Chrome đang mở `?view=stage`.
3. Kéo và crop cho sân khấu lấp đầy khung dọc.
4. Bật thu âm thanh hệ thống hoặc ứng dụng nếu muốn phát hiệu ứng âm thanh.

### Mẹo

- Nút 🔊/🔇 ở góc trên phải sân khấu để tắt hoặc bật toàn bộ âm thanh. Nút 🎵 bên dưới chỉ tắt hoặc bật nhạc nền. Cả hai lựa chọn được nhớ giữa các lần mở.
- **Nhạc nền** được tự tổng hợp bằng Web Audio (`src/game/music.ts`), không dùng file nhạc nên không lo bản quyền. Nhạc theo âm giai ngũ cung, gồm đàn tranh, sáo, trống taiko và mõ, và đổi theo cảnh: đi đường êm có sáo, đánh boss trống dồn, boss nổi giận nhanh hơn, cả đội gục thì chậm buồn, tới chùa Như Lai có chuông chùa. Lúc hợp kích nhạc tự nhỏ lại cho hiệu ứng nổi bật.
- Trong prototype, người xem mô phỏng có tên "Khách thử ###" và gắn nhãn TEST. Đây chỉ là dữ liệu thử, đừng phát lên live như người xem thật.
