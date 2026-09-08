// Premium "golden pass" generator for Trailstorm complimentary tickets.
// Draws an all-access VIP / Champion / Competitor pass on a <canvas> using the
// site's own brand fonts + logos, then downloads a high-resolution PNG.
// Zero new dependencies — reuses the `qrcode` package already in the project.

import QRCode from 'qrcode';

// ---- brand tokens (mirrors tailwind.config.js) --------------------------------
const GOLD = {
  deep: '#7a5a16',
  base: '#f59e0b',
  bright: '#fbbf24',
  light: '#fde68a',
};
const INK = '#0a0a0a';
const TERRA = '#fb923c';

const CATEGORY_LABEL = {
  vip: 'ALL-ACCESS VIP',
  club_champion: 'CLUB CHAMPION',
  individual_competitor: 'COMPETITOR',
};

const VIP_TYPE_LABEL = {
  sponsor: 'Sponsor',
  media: 'Media',
  influencer: 'Influencer',
  government: 'Government Official',
  brand_guest: 'Brand Guest',
  speaker: 'Speaker',
  investor: 'Investor',
  special_invitee: 'Special Invitee',
};
const RIDER_LABEL = {
  pro_rider: 'Pro Rider',
  brand_rider: 'Brand Rider',
  influencer: 'Influencer',
  special_invitee: 'Special Invitee',
  competition_winner: 'Competition Winner',
};

// ---- small helpers ------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD.deep);
  g.addColorStop(0.25, GOLD.bright);
  g.addColorStop(0.5, GOLD.light);
  g.addColorStop(0.75, GOLD.base);
  g.addColorStop(1, GOLD.deep);
  return g;
}

// letter-spaced centered/aligned text (works on every browser)
function spacedText(ctx, text, x, y, spacing, align = 'center') {
  const chars = [...String(text)];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
  return total;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load("400 120px 'Bebas Neue'"),
      document.fonts.load("700 40px 'Barlow Condensed'"),
      document.fonts.load("800 40px 'Barlow Condensed'"),
      document.fonts.load("500 40px 'Barlow Condensed'"),
      document.fonts.load("400 40px 'DM Sans'"),
      document.fonts.load("700 40px 'DM Sans'"),
    ]);
    await document.fonts.ready;
  } catch { /* fall back to system fonts */ }
}

function fmtDates(event) {
  const s = event?.startDate ? new Date(event.startDate) : null;
  const e = event?.endDate ? new Date(event.endDate) : null;
  if (!s) return 'TBA';
  const opt = { day: 'numeric', month: 'short' };
  const sd = s.toLocaleDateString('en-GB', opt);
  if (!e || s.toDateString() === e.toDateString()) {
    return `${sd} ${s.getFullYear()}`.toUpperCase();
  }
  const sameMonth = s.getMonth() === e.getMonth();
  const ed = e.toLocaleDateString('en-GB', opt);
  const left = sameMonth ? s.getDate() : sd;
  return `${left}–${ed} ${e.getFullYear()}`.toUpperCase();
}

function fmtVenue(event) {
  const loc = event?.location || {};
  return [loc.venue, loc.city].filter(Boolean).join(', ') || event?.title || 'Trailstorm';
}

// ---- main draw ----------------------------------------------------------------
export async function drawCompPass(canvas, ticket, event) {
  const W = 1000, H = 1400, S = 2; // logical size, 2× export
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);
  ctx.textBaseline = 'alphabetic';

  await ensureFonts();

  const category = ticket.category || 'vip';
  const catLabel = CATEGORY_LABEL[category] || 'ALL-ACCESS';
  const typeLabel = ticket.vipType ? VIP_TYPE_LABEL[ticket.vipType]
    : ticket.riderCategory ? RIDER_LABEL[ticket.riderCategory]
    : ticket.clubName ? `Slot ${ticket.slot || '?'} · ${ticket.clubName}`
    : '';
  const passes = category === 'vip' ? Math.max(1, Number(ticket.numPasses) || 1) : 1;

  const [qrUrl, trailLogo, brandLogo] = await Promise.all([
    QRCode.toDataURL(
      JSON.stringify({ t: ticket.ticketId, n: ticket.name, c: category, e: event?.slug || '' }),
      { width: 480, margin: 0, color: { dark: '#0a0a0a', light: '#ffffff' }, errorCorrectionLevel: 'M' }
    ).then(loadImage),
    loadImage('/logos/trailstorm.png'),
    loadImage('/logos/angeles-roadsters.png'),
  ]);

  const M = 34;               // outer frame margin
  const PAD = 74;             // content padding
  const cx = W / 2;
  const contentL = PAD;
  const contentR = W - PAD;
  const contentW = contentR - contentL;

  // --- background -------------------------------------------------------------
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#14110b');
  bg.addColorStop(0.5, '#0d0b08');
  bg.addColorStop(1, INK);
  roundRect(ctx, 0, 0, W, H, 46);
  ctx.fillStyle = bg;
  ctx.fill();

  // warm glow top
  const glow = ctx.createRadialGradient(cx, 120, 40, cx, 120, 620);
  glow.addColorStop(0, 'rgba(245,158,11,0.20)');
  glow.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = glow;
  roundRect(ctx, 0, 0, W, H, 46);
  ctx.fill();

  // giant translucent watermark
  ctx.save();
  roundRect(ctx, M, M, W - 2 * M, H - 2 * M, 34);
  ctx.clip();
  ctx.translate(cx, H / 2 + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.font = "400 520px 'Bebas Neue', 'Barlow Condensed', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(245,158,11,0.05)';
  ctx.fillText(catLabel.split(' ').pop(), 0, 180);
  ctx.restore();

  // --- gold frame -------------------------------------------------------------
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = goldGradient(ctx, M, M, W - M, H - M);
  roundRect(ctx, M, M, W - 2 * M, H - 2 * M, 34);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(253,230,138,0.45)';
  roundRect(ctx, M + 12, M + 12, W - 2 * M - 24, H - 2 * M - 24, 26);
  ctx.stroke();
  ctx.restore();

  // --- header -----------------------------------------------------------------
  let y = 96;
  ctx.fillStyle = GOLD.light;
  ctx.font = "700 22px 'Barlow Condensed', sans-serif";
  spacedText(ctx, 'ANGELS & ROADSTERS  ·  PRESENTS', cx, y, 5);

  // trailstorm hero logo
  y += 30;
  if (trailLogo) {
    const lw = Math.min(560, trailLogo.width);
    const scale = lw / trailLogo.width;
    const lh = trailLogo.height * scale;
    ctx.drawImage(trailLogo, cx - lw / 2, y, lw, Math.min(lh, 150));
    y += Math.min(lh, 150) + 20;
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = "400 116px 'Bebas Neue', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('TRAILSTORM', cx, y + 110);
    y += 150;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = "500 26px 'Barlow Condensed', sans-serif";
  spacedText(ctx, `${fmtVenue(event).toUpperCase()}  ·  ${fmtDates(event)}`, cx, y, 3);
  y += 34;

  // divider
  ctx.save();
  ctx.strokeStyle = goldGradient(ctx, contentL, y, contentR, y);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(contentL, y); ctx.lineTo(contentR, y); ctx.stroke();
  ctx.restore();

  // --- gold foil access band --------------------------------------------------
  y += 30;
  const bandH = 78;
  ctx.save();
  roundRect(ctx, contentL, y, contentW, bandH, 16);
  ctx.fillStyle = goldGradient(ctx, contentL, y, contentR, y + bandH);
  ctx.fill();
  // sheen
  const sheen = ctx.createLinearGradient(contentL, y, contentL, y + bandH);
  sheen.addColorStop(0, 'rgba(255,255,255,0.55)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.18)');
  roundRect(ctx, contentL, y, contentW, bandH, 16);
  ctx.fillStyle = sheen;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = "800 46px 'Barlow Condensed', sans-serif";
  spacedText(ctx, catLabel + ' PASS', cx, y + 53, 6);
  ctx.restore();
  y += bandH + 62;

  // --- pass holder ------------------------------------------------------------
  ctx.fillStyle = GOLD.bright;
  ctx.font = "700 22px 'Barlow Condensed', sans-serif";
  spacedText(ctx, 'PASS HOLDER', cx, y, 6);
  y += 94;
  ctx.fillStyle = '#ffffff';
  // fit name
  let nameSize = 92;
  ctx.textAlign = 'center';
  do {
    ctx.font = `400 ${nameSize}px 'Bebas Neue', sans-serif`;
    if (ctx.measureText(ticket.name || '').width <= contentW - 20) break;
    nameSize -= 4;
  } while (nameSize > 44);
  ctx.fillText((ticket.name || '').toUpperCase(), cx, y);
  y += 32;

  if (typeLabel) {
    const chipY = y;
    ctx.font = "700 24px 'Barlow Condensed', sans-serif";
    const tw = ctx.measureText(typeLabel.toUpperCase()).width + 44;
    roundRect(ctx, cx - tw / 2, chipY, tw, 42, 21);
    ctx.fillStyle = 'rgba(251,146,60,0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251,146,60,0.5)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx - tw / 2, chipY, tw, 42, 21);
    ctx.stroke();
    ctx.fillStyle = TERRA;
    spacedText(ctx, typeLabel.toUpperCase(), cx, chipY + 28, 2);
    y += 42;
  }
  y += 60;

  // --- detail grid ------------------------------------------------------------
  const rows = [
    ['EVENT', (event?.title || 'Trailstorm').toUpperCase()],
    ['ADMIT', category === 'vip' ? `${passes} ${passes === 1 ? 'PERSON' : 'PERSONS'}` : '1 PERSON'],
    ['VENUE', fmtVenue(event).toUpperCase()],
    ['VALID', fmtDates(event)],
  ];
  const colW = contentW / 2;
  const cellH = 104;
  ctx.textAlign = 'left';
  rows.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = contentL + col * colW;
    const by = y + row * cellH;
    ctx.fillStyle = GOLD.bright;
    ctx.font = "700 19px 'Barlow Condensed', sans-serif";
    spacedText(ctx, r[0], bx, by, 4, 'left');
    ctx.fillStyle = '#f3f3f3';
    ctx.font = "700 30px 'Barlow Condensed', sans-serif";
    // clamp long values
    let v = r[1];
    while (ctx.measureText(v).width > colW - 30 && v.length > 6) v = v.slice(0, -2);
    if (v !== r[1]) v = v.slice(0, -1) + '…';
    ctx.fillText(v, bx, by + 34);
  });
  y += 2 * cellH + 20;

  // --- QR + credentials strip -------------------------------------------------
  const stripY = H - 300;
  // perforation
  ctx.save();
  ctx.setLineDash([2, 10]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(253,230,138,0.4)';
  ctx.beginPath(); ctx.moveTo(contentL, stripY - 34); ctx.lineTo(contentR, stripY - 34); ctx.stroke();
  ctx.restore();

  const qrSize = 190;
  const qrPad = 16;
  roundRect(ctx, contentL, stripY, qrSize + qrPad * 2, qrSize + qrPad * 2, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (qrUrl) ctx.drawImage(qrUrl, contentL + qrPad, stripY + qrPad, qrSize, qrSize);

  const tx = contentL + qrSize + qrPad * 2 + 34;
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD.bright;
  ctx.font = "700 20px 'Barlow Condensed', sans-serif";
  spacedText(ctx, 'SCAN AT GATE', tx, stripY + 24, 4, 'left');

  ctx.fillStyle = '#ffffff';
  ctx.font = "400 40px 'Bebas Neue', sans-serif";
  ctx.fillText(ticket.ticketId || '—', tx, stripY + 72);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = "400 20px 'DM Sans', sans-serif";
  const issuer = ticket.issuedBy || ticket.approvedBy || 'Angels & Roadsters';
  ctx.fillText(`Issued by ${issuer}`, tx, stripY + 108);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = "400 18px 'DM Sans', sans-serif";
  ctx.fillText('Non-transferable · Carry a valid photo ID', tx, stripY + 138);

  // brand emblem bottom-right
  if (brandLogo) {
    const ew = 92;
    const es = ew / brandLogo.width;
    const eh = brandLogo.height * es;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(brandLogo, contentR - ew, stripY + qrSize + qrPad * 2 - eh + 6, ew, eh);
    ctx.globalAlpha = 1;
  }

  // footer legal
  ctx.fillStyle = 'rgba(253,230,138,0.55)';
  ctx.font = "500 18px 'Barlow Condensed', sans-serif";
  ctx.textAlign = 'center';
  spacedText(ctx, 'OFFICIAL COMPLIMENTARY PASS  ·  ONE-TIME ENTRY  ·  ANGELSANDROADSTERS.COM', cx, H - 56, 2);
}

// ---- public: build canvas + trigger download ----------------------------------
export async function downloadCompPass(ticket, event) {
  const canvas = document.createElement('canvas');
  await drawCompPass(canvas, ticket, event);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ticket.ticketId || 'pass'}-${(ticket.name || 'guest').replace(/[^\w]+/g, '-')}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
