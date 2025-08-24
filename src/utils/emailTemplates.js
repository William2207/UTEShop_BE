function otpHtml({ title, code }) {
return `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
<h2>${title}</h2>
<p>Mã xác thực của bạn:</p>
<div style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</div>
<p>Mã có hiệu lực trong <b>10 phút</b>. Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
</div>`;
}
module.exports = { otpHtml };