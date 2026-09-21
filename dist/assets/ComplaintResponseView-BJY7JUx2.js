import{Dt as e,Jt as t,Kt as n,Mt as r,Nt as i,Ot as a,Rn as o,Tt as s,Wt as c,fn as l,in as u,mn as d,xt as f,yn as p}from"./button-BfjT7ki2.js";import{F as m,I as h,L as g,_,r as v,t as y,v as b}from"./index-4wnXBkEE.js";import{t as x}from"./tag-Dis2h8uP.js";import{t as S}from"./AppButton-CGjIjRym.js";import{r as C,t as w}from"./complaint.service-CB8QjjeY.js";var T={class:`grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5`},E={class:`flex flex-col gap-5`},D={class:`text-2xl font-bold text-gray-800 m-0`},O={class:`text-sm text-gray-500`},k={class:`font-semibold mb-4`},A={key:0,class:`mt-4 rounded-lg bg-gray-50 p-3`},j={class:`text-sm text-gray-600 mt-1`},M=[`href`],N={class:`mt-4`},P={key:1,class:`grid grid-cols-3 gap-2 sm:grid-cols-4`},F=[`href`],I=[`src`,`alt`],L={key:2,class:`text-sm text-gray-400`},R={__name:`ComplaintResponseView`,setup(R){let z=m();h();let B=g(),V=y(`complaints`)?.find(e=>e.complaint_id===Number(z.params.id)),H=d(!V),U=d(!1),W=l({complaint_id:null,status:`Submitted`,category:``,title:``,description:``,submitted_at:``,reporter_name:``,reporter_phone:``,attachments:[],...V}),G=d(V?.status??`Submitted`),K=[{label:`Menunggu Verifikasi`,value:`Submitted`},{label:`Sedang Diproses`,value:`In Progress`},{label:`Selesai`,value:`Resolved`},{label:`Ditolak`,value:`Rejected`}],q={Submitted:`Menunggu Verifikasi`,"In Progress":`Sedang Diproses`,Resolved:`Selesai`,Rejected:`Ditolak`};function J(e,t){return e.response?.data?.message??t}async function Y({background:e=!1}={}){e||(H.value=!0);try{Object.assign(W,await w(z.params.id)),G.value=W.status}catch(e){B.add({severity:`error`,summary:`Gagal memuat pengaduan`,detail:J(e,`Coba lagi.`),life:3500})}finally{e||(H.value=!1)}}async function X(){U.value=!0;try{let e=await C(W.complaint_id,{status:G.value});W.status=e.complaint?.status??G.value,v(`complaints`,e=>e.map(e=>e.complaint_id===W.complaint_id?{...e,status:W.status}:e)),B.add({severity:`success`,summary:`Status pengaduan diperbarui`,life:2500})}catch(e){B.add({severity:`error`,summary:`Gagal memperbarui status`,detail:J(e,`Coba lagi.`),life:3500})}finally{U.value=!1}}function Z(){let e=window.open(``,`_blank`,`width=850,height=1000`);if(!e){B.add({severity:`warn`,summary:`Popup diblokir`,detail:`Izinkan popup untuk mencetak laporan.`,life:3e3});return}let t={Submitted:{bg:`#fef3c7`,text:`#92400e`},"In Progress":{bg:`#dbeafe`,text:`#1e40af`},Resolved:{bg:`#d1fae5`,text:`#065f46`},Rejected:{bg:`#fee2e2`,text:`#991b1b`}}[W.status]||{bg:`#f3f4f6`,text:`#374151`},n={Infrastructure:`Infrastruktur`,"Public Service":`Pelayanan Publik`,Environment:`Lingkungan`,Security:`Keamanan`,Other:`Lainnya`}[W.category]||W.category,r=W.submitted_at?new Date(W.submitted_at).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`}):`-`,i=W.attachments?.length?`<div class="attachment-grid">${W.attachments.map(e=>`<div class="attachment-item"><img src="${e.file_path}" /></div>`).join(``)}</div>`:`<p class="empty-text">Tidak ada lampiran yang disertakan.</p>`,a=W.latitude&&W.longitude?`<a class="maps-link" href="https://www.google.com/maps?q=${W.latitude},${W.longitude}">Lihat titik lokasi di Google Maps →</a>`:``;e.document.write(`
    <html>
      <head>
        <title>Laporan Aduan #${W.complaint_id}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1f2937;
            padding: 48px 56px;
            max-width: 780px;
            margin: 0 auto;
            font-size: 13.5px;
            line-height: 1.6;
          }

          .kop {
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 16px;
            margin-bottom: 8px;
          }
          .kop-text h1 {
            font-size: 16px;
            margin: 0;
            color: #1e3a8a;
            letter-spacing: 0.3px;
          }
          .kop-text p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #6b7280;
          }

          .doc-title {
            text-align: center;
            margin: 28px 0 4px;
          }
          .doc-title h2 {
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            color: #111827;
          }
          .doc-title p {
            font-size: 12px;
            color: #6b7280;
            margin: 4px 0 0;
          }

          .top-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 24px 0 20px;
            padding: 14px 18px;
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
          }
          .meta-item .label {
            font-size: 10.5px;
            text-transform: uppercase;
            color: #9ca3af;
            font-weight: 600;
            letter-spacing: 0.4px;
          }
          .meta-item .value {
            font-size: 13.5px;
            font-weight: 700;
            color: #111827;
            margin-top: 2px;
          }
          .status-pill {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 700;
            background: ${t.bg};
            color: ${t.text};
          }

          .section {
            margin-bottom: 22px;
          }
          .section-label {
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #9ca3af;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .section-label::before {
            content: "";
            width: 3px;
            height: 12px;
            background: #1e3a8a;
            border-radius: 2px;
            display: inline-block;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .info-box {
            background: #f9fafb;
            border: 1px solid #eef0f3;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .info-box .label {
            font-size: 10.5px;
            color: #9ca3af;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .info-box .value {
            font-size: 13.5px;
            font-weight: 600;
            color: #111827;
          }

          .content-box {
            background: #f9fafb;
            border: 1px solid #eef0f3;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 13.5px;
            color: #1f2937;
            white-space: pre-line;
          }

          .location-title {
            font-weight: 700;
            font-size: 14px;
            color: #111827;
            margin-bottom: 10px;
          }

          .maps-link {
            display: inline-block;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #1d4ed8;
            text-decoration: none;
          }

          .attachment-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .attachment-item {
            aspect-ratio: 1 / 1;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          .attachment-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .empty-text {
            font-size: 12.5px;
            color: #9ca3af;
            font-style: italic;
          }

          .signature-area {
            margin-top: 48px;
            display: flex;
            justify-content: flex-end;
          }
          .signature-block {
            text-align: center;
            width: 220px;
          }
          .signature-block .place-date {
            font-size: 12.5px;
            margin-bottom: 64px;
          }
          .signature-block .name {
            font-size: 13px;
            font-weight: 700;
            text-decoration: underline;
          }
          .signature-block .role {
            font-size: 11.5px;
            color: #6b7280;
            margin-top: 2px;
          }

          .footer-note {
            margin-top: 40px;
            padding-top: 14px;
            border-top: 1px solid #e5e7eb;
            font-size: 10.5px;
            color: #9ca3af;
            text-align: center;
          }

          @media print {
            body { padding: 24px 32px; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          <div class="kop-text">
            <h1>PEMERINTAH KALURAHAN BIMOMARTANI</h1>
            <p>Kapanewon Ngemplak, Kabupaten Sleman, Daerah Istimewa Yogyakarta</p>
          </div>
        </div>

        <div class="doc-title">
          <h2>Laporan Aduan Masyarakat</h2>
          <p>Nomor Referensi: #${W.complaint_id}</p>
        </div>

        <div class="top-meta">
          <div class="meta-item">
            <div class="label">Tanggal Pelaporan</div>
            <div class="value">${r}</div>
          </div>
          <div class="meta-item">
            <div class="label">Kategori</div>
            <div class="value">${n}</div>
          </div>
          <div class="meta-item">
            <div class="label">Status</div>
            <span class="status-pill">${q[W.status]??W.status}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Informasi Pelapor</div>
          <div class="info-grid">
            <div class="info-box">
              <div class="label">Nama Pelapor</div>
              <div class="value">${W.reporter_name||`Anonim`}</div>
            </div>
            <div class="info-box">
              <div class="label">Nomor Telepon</div>
              <div class="value">${W.reporter_phone||`Anonim`}</div>
            </div>
          </div>
        </div>

        ${W.location?`<div class="section">
                <div class="section-label">Lokasi Kejadian</div>
                <div class="content-box">
                  ${W.location}
                  ${a}
                </div>
              </div>`:``}

        <div class="section">
          <div class="section-label">Judul Aduan</div>
          <div class="location-title">${W.title}</div>
        </div>

        <div class="section">
          <div class="section-label">Deskripsi Laporan</div>
          <div class="content-box">${W.description}</div>
        </div>

        <div class="section">
          <div class="section-label">Lampiran / Bukti Pendukung</div>
          ${i}
        </div>

        <div class="footer-note">
          Dokumen ini dicetak otomatis melalui Sistem Informasi Bimomartani (SIBIMO) pada ${new Date().toLocaleString(`id-ID`)}.
        </div>
      </body>
    </html>
  `),e.document.close(),e.focus(),setTimeout(()=>e.print(),500)}return c(()=>Y({background:!!V})),(c,l)=>(n(),a(`div`,T,[s(`div`,E,[s(`div`,null,[s(`h1`,D,` Detail Aduan #`+o(W.complaint_id),1),s(`p`,O,` Dibuat pada `+o(W.submitted_at),1)]),i(p(_),null,{content:u(()=>[l[1]||=s(`h2`,{class:`font-semibold mb-4`},`Informasi Pelapor`,-1),s(`p`,null,`Nama: `+o(W.reporter_name||`Anonim`),1),s(`p`,null,`Nomor HP: `+o(W.reporter_phone||`Anonim`),1)]),_:1}),i(p(_),null,{content:u(()=>[s(`h2`,k,o(W.title),1),i(p(x),{value:W.category,severity:`secondary`},null,8,[`value`]),W.location?(n(),a(`div`,A,[l[2]||=s(`p`,{class:`text-sm font-semibold text-gray-700`},`Lokasi Kejadian`,-1),s(`p`,j,o(W.location),1),W.latitude&&W.longitude?(n(),a(`a`,{key:0,href:`https://www.google.com/maps?q=${W.latitude},${W.longitude}`,target:`_blank`,class:`mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary-700 underline`},` Lihat di Google Maps (`+o(W.latitude)+`, `+o(W.longitude)+`) `,9,M)):e(``,!0)])):e(``,!0),s(`p`,N,o(W.description),1),l[3]||=s(`h3`,{class:`font-semibold mt-5 mb-2`},`Lampiran`,-1),W.attachments?.length?(n(),a(`div`,P,[(n(!0),a(f,null,t(W.attachments,e=>(n(),a(`a`,{key:e.attachment_id,href:e.file_path,target:`_blank`,class:`block aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50`},[s(`img`,{src:e.file_path,alt:e.file_name,class:`h-full w-full object-cover`},null,8,I)],8,F))),128))])):(n(),a(`p`,L,`Belum ada lampiran.`))]),_:1})]),i(p(_),null,{content:u(()=>[l[4]||=s(`h2`,{class:`font-semibold mb-4`},`Status & Tindakan`,-1),i(p(x),{value:q[W.status]??W.status,severity:`info`,class:`mb-3`},null,8,[`value`]),i(p(b),{modelValue:G.value,"onUpdate:modelValue":l[0]||=e=>G.value=e,options:K,"option-label":`label`,"option-value":`value`,class:`w-full mb-3`},null,8,[`modelValue`]),i(S,{label:`Simpan Perubahan`,variant:`primary`,class:`w-full`,loading:U.value,onClick:X},null,8,[`loading`]),i(S,{label:`Cetak Aduan`,icon:`pi pi-print`,variant:`secondary`,outlined:``,class:`w-full mt-2`,onClick:Z})]),default:u(()=>[l[5]||=r(` >`,-1)]),_:1})]))}};export{R as default};