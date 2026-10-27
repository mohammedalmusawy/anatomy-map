import sys
src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()
def rep(a, b):
    global h
    assert h.count(a) == 1, ("not unique/found", a[:80], h.count(a))
    h = h.replace(a, b)

# ١. الحوض صار متاح بالخريطة
rep('<path class="rg soon" data-r="pelvis"', '<path class="rg live pulse" data-r="pelvis"')
rep('const SOON = {pelvis:"الحوض"};', 'const SOON = {};')

# ٢. حقوق الرسوم الجديدة
rep('''  "1117": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1117_Muscles_of_the_Neck_and_Back.jpg"]
};''', '''  "1117": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1117_Muscles_of_the_Neck_and_Back.jpg"],
  "808": ["OpenStax College, Anatomy & Physiology", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:808_Hip_Bone.jpg"],
  "1115": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1115_Muscles_of_the_Pelvic_Floor.jpg"]
};''')

# ٣. منطقة الحوض (التأشيرات منقولة من الرسم نفسه)
PELVIS = '''
  ,pelvis: { ar: "الحوض", en: "Pelvis",
    bones: { img: "img/extra/pelvis-bones.jpg", src: "808",
      note: "الحوض العظمي = عظما الورك (يمين ويسار) من الأمام والجانبين، والعجز والعصعص من الخلف. كل عظم ورك (<b class='en'>Os coxae</b>) يتكوّن من ثلاث عظام تلتحم بعد البلوغ عند الحُقّ: الحرقفة (<span class='en'>Ilium</span>) فوق، والإسك (<span class='en'>Ischium</span>) خلف وتحت، والعانة (<span class='en'>Pubis</span>) أمام وتحت. المفاصل: العجزي الحرقفي (خلف)، والارتفاق العاني (أمام)، ومفصل الورك مع رأس الفخذ. حافة الحوض (<span class='en'>Pelvic brim</span>) تفصل الحوض الكبير (فوق) عن الحوض الصغير (تحت).",
      groups: [
        ["الحرقفة (Ilium)", [["Ilium","الحرقفة"],["Iliac crest","العرف الحرقفي"],["Anterior superior iliac spine","الشوكة الحرقفية الأمامية العلوية"],["Anterior inferior iliac spine","الشوكة الحرقفية الأمامية السفلية"],["Posterior superior iliac spine","الشوكة الحرقفية الخلفية العلوية"],["Posterior inferior iliac spine","الشوكة الحرقفية الخلفية السفلية"],["Iliac fossa","الحفرة الحرقفية"],["Arcuate line","الخط المقوّس"],["Auricular surface","السطح الأذيني (يتمفصل مع العجز)"],["Greater sciatic notch","الثلمة الوركية الكبرى"]]],
        ["الإسك (Ischium)", [["Ischium","الإسك"],["Ischial body","جسم الإسك"],["Ischial spine","الشوكة الإسكية"],["Lesser sciatic notch","الثلمة الوركية الصغرى"],["Ischial tuberosity","الحدبة الإسكية"],["Ischial ramus","فرع الإسك"]]],
        ["العانة (Pubis)", [["Pubis","العانة"],["Pubic body","جسم العانة"],["Pubic tubercle","الحديبة العانية"],["Superior ramus of pubis","الفرع العلوي للعانة"],["Inferior ramus of pubis","الفرع السفلي للعانة"],["Articular surface of pubis (at pubic symphysis)","السطح المفصلي للعانة (عند الارتفاق العاني)"],["Ischiopubic ramus","الفرع الإسكي العاني"]]],
        ["معالم مشتركة", [["Acetabulum","الحُقّ (تجويف مفصل الورك)"],["Obturator foramen","الثقبة السدّادية"]]],
        ["الحوض كاملًا", [["Sacrum","العجز"],["Sacral promontory","الطنف العجزي"],["Coccyx","العصعص"],["Sacroiliac joint","المفصل العجزي الحرقفي"],["Pubic symphysis","الارتفاق العاني"],["Pelvic brim","حافة الحوض"]]]
      ]},
    muscles: { img: "img/extra/pelvis-muscles.jpg", src: "1115",
      note: "قاع الحوض (الحجاب الحوضي) = الرافعة الشرجية (<span class='en'>Levator ani</span>: العانية العصعصية والعانية المستقيمية والحرقفية العصعصية) + العصعصية. يسند أعضاء الحوض، وتعبر منه القناة الإحليلية والمهبلية (عند الإناث) والشرجية.",
      groups: [
        ["الرافعة الشرجية (Levator ani)", [["Pubococcygeus","العانية العصعصية"],["Iliococcygeus","الحرقفية العصعصية"]]],
        ["من الرسم", [["Iliacus","الحرقفية"],["Pubic crest","العرف العاني"],["Iliac crests","العرفان الحرقفيان"],["Sacrum","العجز"]]],
        ["الفتحات بقاع الحوض", [["Urethral canal","القناة الإحليلية"],["Vaginal canal (females only)","القناة المهبلية (للإناث فقط)"],["Rectal canal","القناة الشرجية"]]]
      ]}
  }
};
const SOON'''
rep('''  }
};
const SOON''', '  }' + PELVIS)

# ٤. صور العظام الحقيقية للحوض
rep('''    ["lumbar-vert-sup","Lumbar vertebra — superior view","فقرة قطنية — منظر علوي","MAKY.OREL · CC0","Vertebra_-_lumbales_(superior_view).jpg"]
  ]
};''', '''    ["lumbar-vert-sup","Lumbar vertebra — superior view","فقرة قطنية — منظر علوي","MAKY.OREL · CC0","Vertebra_-_lumbales_(superior_view).jpg"]
  ],
  pelvis: [
    ["extra/pelvis-front","Bony pelvis: hip bones and sacrum — anterior view","الحوض العظمي: عظما الورك والعجز — منظر أمامي","MAKY.OREL · CC0","Pelvis_-_os_coxae,_os_sacrum_(frontal_view).jpg"],
    ["extra/pelvis-back","Bony pelvis — posterior view","الحوض العظمي — منظر خلفي","MAKY.OREL · CC0","Pelvis_-_os_coxae,_os_sacrum_(posterior_view).jpg"],
    ["extra/hip-bone-lat","Hip bone (os coxae) — lateral view, acetabulum","عظم الورك — منظر وحشي يبين الحُقّ","MAKY.OREL · CC0","Pelvis_-_os_coxae_(lateral_view).jpg"],
    ["extra/sacrum-ant","Sacrum — anterior (pelvic) surface with sacral foramina","العجز — الوجه الأمامي (الحوضي) مع الثقوب العجزية","MAKY.OREL · CC0","Pelvis_-_os_sacrum_(anterior).jpg"]
  ]
};''')

# ٥. مجموعات القائمة الجديدة
rep('hypothenar:"بارزة الخنصر (Hypothenar)",central:"العضلات الوسطى"};',
    'hypothenar:"بارزة الخنصر (Hypothenar)",central:"العضلات الوسطى","pelvic-floor":"قاع الحوض (Pelvic floor)","pelvic-wall":"جدار الحوض (Pelvic wall)",iliopsoas:"الحرقفية القطنية (Iliopsoas)"};')

# ٦. الأشعة: نضيف data/xray-extra.json، والحوض يعرض كمان صوره القديمة (reuse)
rep('const xrayReady=fetch("data/xray.json").then(r=>r.json()).then(j=>XRAY=j);',
    'const xrayReady=Promise.all([fetch("data/xray-clean.json").then(r=>r.json()),fetch("data/xray-extra.json").then(r=>r.json()).catch(()=>({views:[],reuse:{}}))])\n  .then(([a,b])=>XRAY={...a,views:[...b.views,...a.views],reuse:b.reuse||{}});')
rep('const views=XRAY.views.filter(v=>v.region===r);',
    'const views=XRAY.views.filter(v=>v.region===r||(XRAY.reuse[r]||[]).includes(v.id));')

# ٦ب. التأشير (قرار محمد 27/10/2026): الخريطة الجديدة تقرا data/xray-clean.json (من tools/clean_labels.py)
# بيه بس التسميات اللي موضعها من مصدر الصورة نفسه؛ اللي انحطت بالتقدير انشالت. الصورة اللي ما بقى بيها
# تأشير تنعرض بدون نقاط، وزرّي «الأسماء» و«اختبر نفسك» والقائمة يختفون (ما يبقى زر يشتغل على فراغ).
rep('''        <button id="x-test">❓ اختبر نفسك</button>
      </div>''', '''        <button id="x-test">❓ اختبر نفسك</button>
      </div>
      <p class="xnote" id="xnote" hidden>هاي الصورة بدون تأشير: التسميات اللي انحطت بالتقدير انشالت، وتبقى بس التسميات اللي مأشّرها مصدر الصورة نفسه.</p>''')
rep('.xtools button.on{', '.xnote{font-size:12.5px;opacity:.75;margin:0 0 8px;line-height:1.6}\n.xtools button.on{')
rep('''  $("xlegend").innerHTML=v.pts.map((p,i)=>`<li data-i="${i}"><b class="en">${p[3]}</b><span>${p[4]}</span></li>`).join("");
  xInfo(null,v);''', '''  $("xlegend").innerHTML=v.pts.map((p,i)=>`<li data-i="${i}"><b class="en">${p[3]}</b><span>${p[4]}</span></li>`).join("");
  const np=v.pts.length, srcs=[...new Set(v.pts.map(p=>p[5]).filter(Boolean))];
  $("x-names").hidden=!np; $("x-test").hidden=np<4; $("xlegend").hidden=!np; $("xnote").hidden=!!np;
  if(srcs.length) $("x-credit").innerHTML+=` · Labels from source: ${srcs.join(", ")}`;
  xInfo(null,v);''')

# ٧. المجسّم
rep('const RNAME={arm:"العضد",forearm:"الساعد",hand:"اليد",thigh:"الفخذ",leg:"الساق",foot:"القدم",spine:"العمود الفقري"};',
    'const RNAME={arm:"العضد",forearm:"الساعد",hand:"اليد",thigh:"الفخذ",leg:"الساق",foot:"القدم",spine:"العمود الفقري",pelvis:"الحوض"};')
rep('const MODEL_OF={arm:"upper-limb",forearm:"upper-limb",hand:"upper-limb",thigh:"lower-limb",leg:"lower-limb",foot:"lower-limb",spine:"spine"};',
    'const MODEL_OF={arm:"upper-limb",forearm:"upper-limb",hand:"upper-limb",thigh:"lower-limb",leg:"lower-limb",foot:"lower-limb",spine:"spine",pelvis:"pelvis"};')
rep('infoReady=fetch("data/info.json").then(r=>r.json()).then(j=>info=j);',
    'infoReady=Promise.all([fetch("data/info.json").then(r=>r.json()),fetch("data/info-extra.json").then(r=>r.json()).catch(()=>({}))]).then(([a,b])=>info={...b,...a});')
# ═════ الصدر (القفص الصدري): كان أشعة بس، صار مجسّم كامل ═════
rep('const XONLY = {head:{ar:"الرأس",en:"Head (Skull)"}, chest:{ar:"الصدر",en:"Chest (Thorax)"}, abdomen:{ar:"البطن",en:"Abdomen"}};',
    'const XONLY = {head:{ar:"الرأس",en:"Head (Skull)"}, abdomen:{ar:"البطن",en:"Abdomen"}};')
rep('''  "1115": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1115_Muscles_of_the_Pelvic_Floor.jpg"]
};''', '''  "1115": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1115_Muscles_of_the_Pelvic_Floor.jpg"],
  "gray115": ["Henry Vandyke Carter, Gray's Anatomy (1918)", "Public domain", "https://commons.wikimedia.org/wiki/File:Gray115.png"],
  "1119": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1119_Muscles_that_Move_the_Humerus.jpg"]
};''')
CHESTR = """
  ,chest: { ar: "الصدر", en: "Chest (Thorax)",
    bones: { img: "img/extra/chest-bones.png", src: "gray115",
      note: "القفص الصدري = القص من الأمام، و12 زوج أضلاع مع غضاريفها الضلعية، و12 فقرة صدرية من الخلف. الأضلاع 1–7 <b>حقيقية</b> (غضروفها يتصل بالقص مباشرة)، و8–10 <b>كاذبة</b> (غضروفها يتصل بالغضروف اللي فوگه ويكوّن الحافة الضلعية)، و11–12 <b>عائمة</b> (بلا اتصال أمامي). القص ثلاث قطع: القبضة والجسم والناتئ الرهابي، ومفصل القبضة مع الجسم = الزاوية القصية بمستوى الضلع الثاني. وبالمجسّم كمان الترقوة ولوح الكتف (حزام الكتف) فوق القفص؛ الغضاريف زرقاء فاتحة، والأضلاع الكاذبة والعائمة أغمق شوية.",
      groups: [
        ["القص (Sternum)", [["1st piece or Manubrium","القطعة الأولى أو القبضة"],["Jugular notch","الثلمة الوِدجية"],["2nd piece or Body","القطعة الثانية أو الجسم"],["3rd piece or Xiphoid process","القطعة الثالثة أو الناتئ الرهابي"],["Articular facet for clavicle","الوجيه المفصلي للترقوة"]]],
        ["الأضلاع (Ribs)", [["Vertebro-sternal or True ribs (1–7)","الأضلاع الفقرية القصية أو الحقيقية (1–7)"],["False ribs: Vertebro-costal (8–10)","الأضلاع الكاذبة: الفقرية الضلعية (8–10)"],["Vertebral (floating) ribs (11–12)","الأضلاع الفقرية (العائمة) (11–12)"],["Costal cartilages","الغضاريف الضلعية"]]],
        ["مناشئ العضلات المؤشّرة بالأحمر", [["Sternocleidomastoideus","القصية الترقوية الخشّائية"],["Subclavius","تحت الترقوة"],["Pectoralis major","الصدرية الكبرى"],["Pectoralis minor","الصدرية الصغرى"],["Rectus abdominis","المستقيمة البطنية"],["Pect. maj. (abdominal slip)","الصدرية الكبرى (الشريحة البطنية)"],["Triangularis sterni (transversus thoracis)","المثلثة القصية (المستعرضة الصدرية)"]]]
      ]},
    muscles: { img: "img/extra/chest-muscles.jpg", src: "1119",
      note: "بالمجسّم: الصدرية الكبرى بأجزائها الثلاثة (سطحية)، ثم الصدرية الصغرى وتحت الترقوة والمسنّنة الأمامية (وسطى)، ثم الحجاب الحاجز (عميقة) — قبتاه تبينان بأشعة الصدر، واليمنى أعلى من اليسرى.",
      groups: [
        ["من الرسم (a, c)", [["Pectoralis major","الصدرية الكبرى"],["Pectoralis major (cut)","الصدرية الكبرى (مقطوعة)"],["Serratus anterior","المسنّنة الأمامية"],["Latissimus dorsi","العريضة الظهرية"],["Deltoid","الدالية"],["Subscapularis","تحت الكتف"],["Teres major","المدوّرة الكبرى"],["Coracoid process of scapula","الناتئ الغرابي للوح الكتف"]]],
        ["من الرسم (b, d)", [["Supraspinatus","فوق الشوكة"],["Infraspinatus","تحت الشوكة"],["Teres minor","المدوّرة الصغرى"],["Spine of scapula","شوكة لوح الكتف"],["Humerus","عظم العضد"],["Triceps brachii: long head","ثلاثية الرؤوس العضدية: الرأس الطويل"],["Triceps brachii: lateral head","ثلاثية الرؤوس العضدية: الرأس الوحشي"]]]
      ]}
  }
};
const SOON = {};"""
rep('  }\n};\nconst SOON = {};', '  }' + CHESTR)
rep('''    ["extra/sacrum-ant","Sacrum — anterior (pelvic) surface with sacral foramina","العجز — الوجه الأمامي (الحوضي) مع الثقوب العجزية","MAKY.OREL · CC0","Pelvis_-_os_sacrum_(anterior).jpg"]
  ]
};''', '''    ["extra/sacrum-ant","Sacrum — anterior (pelvic) surface with sacral foramina","العجز — الوجه الأمامي (الحوضي) مع الثقوب العجزية","MAKY.OREL · CC0","Pelvis_-_os_sacrum_(anterior).jpg"]
  ],
  chest: [
    ["extra/ribs","Ribs — left and right specimens","أضلاع — عيّنات يسار ويمين","MAKY.OREL · CC0","Costae_-_sin,_dex.jpg"],
    ["extra/ribs-1-3","Ribs 1, 2 and 3 — the 1st is short, broad and flat","الأضلاع 1 و2 و3 — الأول قصير وعريض ومسطّح","MAKY.OREL · CC0","Costae_-_1,_2,_3.jpg"],
    ["extra/clavicles","Clavicles — left and right","الترقوتان — اليسرى واليمنى","MAKY.OREL · CC0","Clavicula_-_sin,_dex.jpg"],
    ["extra/scapula-ant","Scapula — anterior (costal) view","لوح الكتف — منظر أمامي (الوجه الضلعي)","MAKY.OREL · CC0","Scapula_-_anterior_view.jpg"]
  ]
};''')
rep('iliopsoas:"الحرقفية القطنية (Iliopsoas)"};',
    'iliopsoas:"الحرقفية القطنية (Iliopsoas)",sternum:"القص (Sternum)","rib-true":"الأضلاع الحقيقية (1–7)","rib-false":"الأضلاع الكاذبة (8–10)","rib-floating":"الأضلاع العائمة (11–12)",cartilage:"الغضاريف الضلعية",girdle:"حزام الكتف (الترقوة ولوح الكتف)"};')
rep('spine:"العمود الفقري",pelvis:"الحوض"};', 'spine:"العمود الفقري",pelvis:"الحوض",chest:"الصدر"};')
rep('spine:"spine",pelvis:"pelvis"};', 'spine:"spine",pelvis:"pelvis",chest:"chest"};')
rep('disc:"#8fb8e3"};', 'disc:"#8fb8e3",\n  // القفص الصدري: الغضاريف زرقاء فاتحة، والأضلاع الكاذبة والعائمة أغمق شوية\n  cartilage:"#a9c9e8","rib-false":"#e3d1ad","rib-floating":"#d6bf98"};')
# الصدر بيه 45 عظم: نخلي التأشيرات للأضلاع 1 و7 و11 و12 والقص وحزام الكتف حتى ما تزدحم
rep('!/phalanx|intervertebral/.test(p.key)', '!/phalanx|intervertebral|cartilage|^(2nd|3rd|4th|5th|6th|8th|9th|10th)-rib/.test(p.key)')
# أسماء أجزاء الصدرية الكبرى طويلة على التأشيرة
rep('[" metacarpal"," MC"]];', '[" metacarpal"," MC"],["Pectoralis major — ","Pec. major "],[" part (", " ("]];')

# ═════ الرأس (الجمجمة): كان أشعة بس، صار مجسّم عظام + عضلات الرقبة ═════
rep('const XONLY = {head:{ar:"الرأس",en:"Head (Skull)"}, abdomen:{ar:"البطن",en:"Abdomen"}};',
    'const XONLY = {abdomen:{ar:"البطن",en:"Abdomen"}};')
rep('''  "1119": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1119_Muscles_that_Move_the_Humerus.jpg"]
};''', '''  "1119": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1119_Muscles_that_Move_the_Humerus.jpg"],
  "705": ["OpenStax College, Anatomy & Physiology", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:705_Lateral_View_of_Skull-01.jpg"],
  "1106": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1106_Front_and_Side_Views_of_the_Muscles_of_Facial_Expressions.jpg"]
};''')
HEADR = """
  ,head: { ar: "الرأس", en: "Head (Skull)",
    bones: { img: "img/extra/head-bones.jpg", src: "705",
      note: "الجمجمة 22 عظم: 8 عظام قحفية تحمي الدماغ (الجبهي، والجداريان، والصدغيان، والقذالي، والوتدي، والغربالي) و14 عظم وجهي (الفكان العلويان، والوجنيان، والأنفيان، والدمعيان، والحنكيان، والمحارتان السفليتان، والميكعة، والفك السفلي). العظام تلتقي بدروز ثابتة، والفك السفلي هو الوحيد المتحرك (المفصل الصدغي الفكي). العظم اللامي بالرقبة ما يتمفصل ويّا أي عظم. البتيريون (<span class='en'>Pterion</span>) = ملتقى الجبهي والجداري والصدغي والوتدي، وتحته الشريان السحائي الأوسط.",
      groups: [
        ["العظام", [["Frontal bone","العظم الجبهي"],["Parietal bone","العظم الجداري"],["Temporal bone","العظم الصدغي"],["Occipital bone","العظم القذالي"],["Greater wing of sphenoid bone","الجناح الكبير للعظم الوتدي"],["Ethmoid bone","العظم الغربالي"],["Lacrimal bone","العظم الدمعي"],["Nasal bone","العظم الأنفي"],["Zygomatic bone","العظم الوجني"],["Maxilla","الفك العلوي"],["Mandible","الفك السفلي"]]],
        ["الدروز (Sutures)", [["Coronal suture","الدرز الإكليلي"],["Squamous suture","الدرز الحرشفي"],["Lambdoid suture","الدرز اللامي"],["Pterion","البتيريون (ملتقى أربع عظام)"]]],
        ["معالم العظم الصدغي", [["Squamous temporal","الجزء الحرشفي للصدغي"],["Zygomatic process","الناتئ الوجني"],["External acoustic meatus","الصماخ السمعي الظاهر"],["Mastoid portion","الجزء الخشّائي"],["Mastoid process","الناتئ الخشّائي"],["Styloid process","الناتئ الإبري"],["Articular tubercle","الحديبة المفصلية"],["Mandibular fossa","الحفرة الفكية"]]],
        ["معالم أخرى", [["Zygomatic arch","القوس الوجنية"],["Temporal process","الناتئ الصدغي (للوجني)"],["Lacrimal fossa","الحفرة الدمعية"],["Mental protuberance of mandible","البروز الذقني للفك السفلي"]]]
      ]},
    muscles: { img: "img/extra/head-muscles.jpg", src: "1106",
      note: "مصدر المجسّم (BodyParts3D) ما بيه عضلات الوجه ولا عضلات المضغ، فالمجسّم يبين بس عضلتي الرقبة السطحيتين: الجلدية العنقية (<span class='en'>Platysma</span>) والقصية الترقوية الخشّائية (<span class='en'>Sternocleidomastoid</span>). عضلات تعابير الوجه بالرسم المؤشّر، وكلها يعصبها العصب الوجهي (العصب القحفي 7).",
      groups: [
        ["عضلات تعابير الوجه (من الرسم)", [["Epicranial aponeurosis","السفاق القحفي"],["Occipitofrontalis (frontal belly)","القذالية الجبهية (البطن الجبهي)"],["Occipitofrontalis (occipital belly)","القذالية الجبهية (البطن القذالي)"],["Corrugator supercilii","المغضّنة للحاجب"],["Orbicularis oculi","الدويرية العينية"],["Orbicularis oris","الدويرية الفموية"],["Buccinator","المبوّقة (عضلة الخد)"]]]
      ]}
  }
};
const SOON = {};"""
rep('  }\n};\nconst SOON = {};', '  }' + HEADR)
rep('''    ["extra/scapula-ant","Scapula — anterior (costal) view","لوح الكتف — منظر أمامي (الوجه الضلعي)","MAKY.OREL · CC0","Scapula_-_anterior_view.jpg"]
  ]
};''', '''    ["extra/scapula-ant","Scapula — anterior (costal) view","لوح الكتف — منظر أمامي (الوجه الضلعي)","MAKY.OREL · CC0","Scapula_-_anterior_view.jpg"]
  ],
  head: [
    ["extra/skull-pterion","Skull — lateral view; the box marks the pterion","الجمجمة — منظر جانبي؛ المربع يأشّر البتيريون","MAKY.OREL · CC0","Cranium_-_pterion.jpg"],
    ["extra/skull-lat","Skull (calvaria and face) — lateral view showing the sutures","الجمجمة — منظر جانبي يبين الدروز","MAKY.OREL · CC0","Cranium_-_lateral_view.jpg"],
    ["extra/mandible-lat","Mandible — lateral view (condylar and coronoid processes, mental foramen)","الفك السفلي — منظر جانبي (الناتئ اللقمي والإكليلي والثقبة الذقنية)","MAKY.OREL · CC0","Cranium_-_mandibula_(lateral_view).jpg"]
  ]
};''')
rep('girdle:"حزام الكتف (الترقوة ولوح الكتف)"};',
    'girdle:"حزام الكتف (الترقوة ولوح الكتف)",cranial:"عظام القحف (8)",facial:"عظام الوجه (14)",hyoid:"العظم اللامي",neck:"عضلات الرقبة السطحية"};')
rep('pelvis:"الحوض",chest:"الصدر"};', 'pelvis:"الحوض",chest:"الصدر",head:"الرأس"};')
rep('pelvis:"pelvis",chest:"chest"};', 'pelvis:"pelvis",chest:"chest",head:"head"};')
rep('"rib-floating":"#d6bf98"};', '"rib-floating":"#d6bf98",\n  // الجمجمة: القحف والوجه بلونين حتى يبين الحد بينهم\n  cranial:"#ece2cc",facial:"#e3cfa8",hyoid:"#d9c7a6"};')

# ═════ البطن: كان أشعة بس، صار مجسّم (عظام + عضلات + أحشاء) وتبويب ثالث «الأحشاء» ═════
# الأحشاء بالمجسّم kind="organ" بطبقتين: organ (داخل الصفاق) وretro (خلف الصفاق)
rep('const XONLY = {abdomen:{ar:"البطن",en:"Abdomen"}};', 'const XONLY = {};')
rep('.pick .en{display:block;font-size:13px;opacity:.75}',
    '.pick .en{display:block;font-size:13px;opacity:.75}\n.pick.three{grid-template-columns:1fr 1fr 1fr}.pick .o{background:#e7b3a8}')
rep('<button data-k="muscles">💪 العضلات</button>',
    '<button data-k="muscles">💪 العضلات</button>\n      <button data-k="organs" hidden>🫁 الأحشاء</button>')
rep('<button class="m" data-k="muscles"><span class="ic">💪</span><b>العضلات</b><span class="en">Muscles</span></button>',
    '<button class="m" data-k="muscles"><span class="ic">💪</span><b>العضلات</b><span class="en">Muscles</span></button>\n      <button class="o" data-k="organs" id="pick-o" hidden><span class="ic">🫁</span><b>الأحشاء</b><span class="en">Organs</span></button>')
rep('<button data-l="deep"><i style="background:#9e3328"></i>عميقة</button>',
    '<button data-l="deep"><i style="background:#9e3328"></i>عميقة</button>\n          <button data-l="organ" hidden><i style="background:#e3a88f"></i>داخل الصفاق</button>\n          <button data-l="retro" hidden><i style="background:#a2493c"></i>خلف الصفاق</button>')
rep('''  "1106": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1106_Front_and_Side_Views_of_the_Muscles_of_Facial_Expressions.jpg"]
};''', '''  "1106": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1106_Front_and_Side_Views_of_the_Muscles_of_Facial_Expressions.jpg"],
  "gray1220": ["Henry Vandyke Carter, Gray's Anatomy (1918)", "Public domain", "https://commons.wikimedia.org/wiki/File:Gray1220.png"],
  "1112": ["OpenStax, Anatomy & Physiology", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:1112_Muscles_of_the_Abdomen.jpg"],
  "proj": ["Mikael Häggström", "Public domain", "https://commons.wikimedia.org/wiki/File:Surface_projections_of_the_organs_of_the_trunk.png"]
};''')
ABDR = """
  ,abdomen: { ar: "البطن", en: "Abdomen",
    bones: { img: "img/extra/abdomen-bones.png", src: "gray1220",
      note: "عظام البطن هي «الإطار» اللي نقرا عليه أشعة البطن: الفقرات القطنية الخمس بالنص، والأضلاع 10–12 فوق، وجناحا الحرقفة والعجز تحت. " +
        "مستويات مهمة: <b>المستوى البوابي</b> (<span class='en'>Transpyloric plane</span>) بمستوى L1 — يمر بالبوّاب وسرة الكليتين ورأس البنكرياس؛ و<b>مستوى ما فوق العرفين</b> (<span class='en'>Supracristal</span>) بمستوى L4 — يفيد بعدّ الفقرات وتفرّع الأبهر؛ " +
        "و<b>المستوى بين الحديبتين</b> (<span class='en'>Transtubercular</span>) بمستوى L5. البطن ينقسم لتسع مناطق (بالرسم) أو لأربعة أرباع بخطّين يعبرون السرة. الناتئ المستعرض للفقرة L3 هو الأطول، والحالب يمشي فوق أطراف النواتئ المستعرضة.",
      groups: [
        ["المناطق التسع (من الرسم)", [["Hypochondriac (right / left)","المراقّية (يمين / يسار)"],["Epigastric","الشرسوفية (فوق المعدة)"],["Lumbar (right / left)","القطنية (الخاصرة) (يمين / يسار)"],["Umbilical","السرّية"],["Iliac (right / left)","الحرقفية (يمين / يسار)"],["Hypogastric","الخثلية (تحت المعدة)"]]],
        ["المستويات والخطوط", [["Transpyloric plane (L1)","المستوى البوابي (L1)"],["Transtubercular plane (L5)","المستوى بين الحديبتين (L5)"],["Left lateral line","الخط الجانبي الأيسر"],["Lateral sternal line","الخط القصي الجانبي"],["Parasternal line","الخط جنب القص"],["Mammary line","خط الثدي"]]],
        ["عظام الإطار بالمجسّم", [["Lumbar vertebrae L1–L5","الفقرات القطنية L1–L5"],["Ribs 10–12","الأضلاع 10–12"],["Iliac crest","العرف الحرقفي"],["Sacrum","العجز"]]]
      ]},
    muscles: { img: "img/extra/abdomen-muscles.jpg", src: "1112",
      note: "جدار البطن الأمامي من برا للداخل: المائلة الظاهرة ← المائلة الباطنة ← المستعرضة البطنية، والمستقيمة البطنية بالنص داخل غمدها. " +
        "الجدار الخلفي: <b>القطنية الكبرى</b> (<span class='en'>Psoas major</span>) جنب الفقرات، والمربعة القطنية لبرّاها، والحرقفية بالحفرة الحرقفية. بأشعة البطن <b>حافة العضلة القطنية</b> تبين بسبب الدهن حواليها؛ " +
        "اختفاؤها بجهة وحدة ممكن يعني سائل أو نزف أو التهاب خلف الصفاق. مصدر المجسّم (BodyParts3D) بيه المائلة الظاهرة والقطنية الكبرى والحرقفية والحجاب الحاجز بس، فالباقي بالرسم.",
      groups: [
        ["جدار البطن الأمامي (a)", [["External oblique","المائلة الظاهرة"],["Internal oblique","المائلة الباطنة"],["Aponeurosis of internal oblique","سفاق المائلة الباطنة"],["Transversus abdominis","المستعرضة البطنية"],["Rectus abdominis (enclosed within rectus sheath)","المستقيمة البطنية (داخل غمدها)"],["Rectus sheath","غمد المستقيمة"],["Tendinous intersections","التقاطعات الوترية"],["Linea alba","الخط الأبيض"]]],
        ["جدار البطن الخلفي (b)", [["Psoas major","القطنية الكبرى"],["Quadratus lumborum","المربعة القطنية"],["Iliacus","الحرقفية"],["Ilia of hip bones","حرقفتا عظمي الورك"],["Sacrum","العجز"]]],
        ["عضلات مجاورة بالرسم", [["Pectoralis major","الصدرية الكبرى"],["Latissimus dorsi","العريضة الظهرية"],["Anterior serratus muscles","المسنّنة الأمامية"]]]
      ]},
    organs: { img: "img/extra/abdomen-organs.jpg", src: "proj",
      note: "إسقاط الأحشاء على العمود والأضلاع — هذا اللي يحتاجه طالب الأشعة حتى يعرف شنو يبين وين بأشعة البطن. <b>داخل الصفاق</b>: الكبد والمرارة والمعدة والطحال والصائم واللفائفي والقولون المستعرض. " +
        "<b>خلف الصفاق</b>: الاثنا عشري (أغلبه) والبنكرياس والقولون الصاعد والنازل والكليتان والغدتان الكظريتان والحالبان والأبهر والأجوف السفلي. الكلية اليمنى أوطأ من اليسرى بسبب الكبد، وسرة الكليتين على المستوى البوابي (L1). " +
        "نمط الغاز الطبيعي: غاز بالمعدة والقولون والمستقيم، وشوية بالأمعاء الدقيقة (قاعدة 3–6–9 سم). القولون السيني والأعور مو موجودين بمصدر المجسّم، فتبين منطقة الأعور بالوصل اللفائفي الأعوري.",
      groups: [
        ["من الرسم", [["Liver","الكبد"],["Gallbladder","المرارة"],["Stomach","المعدة"],["Spleen","الطحال"],["Pancreas","البنكرياس"],["Celiac artery","الجذع البطني (الشريان الزلاقي)"],["Right kidney","الكلية اليمنى"],["Left kidney","الكلية اليسرى"],["Urinary bladder","المثانة البولية"]]],
        ["معالم سطحية", [["Transpyloric plane","المستوى البوابي"],["Costal margin","الحافة الضلعية"],["Navel","السرة"],["McBurney's point","نقطة ماكبرني"],["Anterior superior iliac spine","الشوكة الحرقفية الأمامية العلوية"],["Inguinal ligament","الرباط الإربي"]]],
        ["مستويات الفقرات", [["Middle of vertebral body","منتصف جسم الفقرة"],["Palpable vertebral spinous process","الناتئ الشوكي المجسوس"]]]
      ]}
  }
};
const SOON = {};"""
rep('  }\n};\nconst SOON = {};', '  }' + ABDR)
rep('''    ["extra/mandible-lat","Mandible — lateral view (condylar and coronoid processes, mental foramen)","الفك السفلي — منظر جانبي (الناتئ اللقمي والإكليلي والثقبة الذقنية)","MAKY.OREL · CC0","Cranium_-_mandibula_(lateral_view).jpg"]
  ]
};''', '''    ["extra/mandible-lat","Mandible — lateral view (condylar and coronoid processes, mental foramen)","الفك السفلي — منظر جانبي (الناتئ اللقمي والإكليلي والثقبة الذقنية)","MAKY.OREL · CC0","Cranium_-_mandibula_(lateral_view).jpg"]
  ],
  abdomen: [
    ["extra/l4-vert-sup","L4 vertebra — superior view: kidney-shaped body, short transverse processes","الفقرة L4 — منظر علوي: جسم بشكل الكلية ونواتئ مستعرضة","MAKY.OREL · CC0","Vertebra_-_lumbales_(superior).jpg"],
    ["lumbar-vert-sup","Lumbar vertebra — superior view","فقرة قطنية — منظر علوي","MAKY.OREL · CC0","Vertebra_-_lumbales_(superior_view).jpg"],
    ["extra/ribs-facets","Ribs — heads with their articular facets (the lower ribs frame the upper abdomen)","أضلاع — رؤوسها ووجيهاتها المفصلية (الأضلاع السفلى تحدّ أعلى البطن)","MAKY.OREL · CC0","Costae_-_articular_facets.jpg"],
    ["extra/pelvis-front","Bony pelvis — iliac crests and sacrum (the lower frame of an abdominal X-ray)","الحوض العظمي — العرفان الحرقفيان والعجز (الإطار السفلي لأشعة البطن)","MAKY.OREL · CC0","Pelvis_-_os_coxae,_os_sacrum_(frontal_view).jpg"]
  ]
};''')
rep('neck:"عضلات الرقبة السطحية"};',
    'neck:"عضلات الرقبة السطحية","abd-wall":"جدار البطن الأمامي",organ:"الأحشاء داخل الصفاق (Intraperitoneal)",retro:"الأحشاء خلف الصفاق (Retroperitoneal)"};')
rep('function openSheet(r){\n  cur=r;',
    'function openSheet(r){\n  const hasO=!!REGIONS[r].organs; $("pick-o").hidden=!hasO; document.querySelector(".pick").classList.toggle("three",hasO);\n  cur=r;')
rep('(xo?"الأشعة":k==="bones"?"العظام":"العضلات")', '(xo?"الأشعة":k==="bones"?"العظام":k==="organs"?"الأحشاء":"العضلات")')
rep('(xo?"Radiographs":k==="bones"?"Bones":"Muscles")', '(xo?"Radiographs":k==="bones"?"Bones":k==="organs"?"Organs":"Muscles")')
# الأشعة تنفتح من تبويب العظام والأحشاء، والصور الحقيقية من العظام بس
rep('if ((mode==="photo"||mode==="xray") && k!=="bones") mode="3d";', 'if ((mode==="photo"&&k!=="bones")||(mode==="xray"&&k==="muscles")) mode="3d";')
rep('((b.dataset.m==="photo"||b.dataset.m==="xray")&&k!=="bones")', '((b.dataset.m==="photo"&&k!=="bones")||(b.dataset.m==="xray"&&k==="muscles"))')
rep('document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.k===k));',
    'document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.k===k));\n  $("tabs").querySelector(\'[data-k="organs"]\').hidden=!R.organs;')
# نقطة الأشعة ممكن تكون «organs:liver» أو «muscles:psoas-major»؛ نفتح التبويب الصح ونكشف الجزء
rep('if(b) b.onclick=async()=>{ await lesson(cur,"bones","3d"); window.Studio.select(b.dataset.k,true); };',
    'if(b) b.onclick=async()=>{ const [tk,pk]=b.dataset.k.includes(":")?b.dataset.k.split(":"):["bones",b.dataset.k]; await lesson(cur,tk,"3d"); window.Studio.reveal(pk); };')
# ── الاستوديو
rep('const colorOf=p=>p.kind==="bone"?(CARPAL[p.key]||BONE[p.grp]||BONE.bone):MUSCLE[p.layer];',
    'const colorOf=p=>p.kind==="bone"?(CARPAL[p.key]||BONE[p.grp]||BONE.bone):p.kind==="organ"?p.tint:MUSCLE[p.layer];')
rep('const ORDER=["sup","mid","deep","bone"];', 'const ORDER=["sup","mid","organ","retro","deep","bone"];')
rep('const LNAME={sup:"سطحية",mid:"وسطى",deep:"عميقة",bone:"عظم"};', 'const LNAME={sup:"سطحية",mid:"وسطى",deep:"عميقة",bone:"عظم",organ:"داخل الصفاق",retro:"خلف الصفاق"};')
rep('pelvis:"الحوض",chest:"الصدر",head:"الرأس"};', 'pelvis:"الحوض",chest:"الصدر",head:"الرأس",abdomen:"البطن"};')
rep('pelvis:"pelvis",chest:"chest",head:"head"};', 'pelvis:"pelvis",chest:"chest",head:"head",abdomen:"abdomen"};')
rep('const layerOn={sup:true,mid:true,deep:true,bone:true};', 'const layerOn={sup:true,mid:true,deep:true,bone:true,organ:true,retro:true};')
rep('(p.kind==="bone"?"عظم":"عضلة "+LNAME[p.layer])', '(p.kind==="bone"?"عظم":p.kind==="organ"?"أحشاء · "+LNAME[p.layer]:"عضلة "+LNAME[p.layer])')
rep('row("يتمفصل مع · Articulates with",I.j);',
    'row("يتمفصل مع · Articulates with",I.j)\n    +row("الموقع · Location",I.loc)+row("المستوى الفقري · Level",I.lv)+row("العلاقات · Relations",I.rel)+row("بالأشعة · On imaging",I.xr);')
rep('kindFocus=kind==="bones"?"bone":"muscle";', 'kindFocus=kind==="bones"?"bone":kind==="organs"?"organ":"muscle";')
rep('Object.assign(layerOn, kind==="bones"?{sup:false,mid:false,deep:false,bone:true}:{sup:true,mid:true,deep:true,bone:true});',
    'Object.assign(layerOn, kind==="bones"?{sup:false,mid:false,deep:false,organ:false,retro:false,bone:true}:kind==="organs"?{sup:false,mid:false,deep:false,organ:true,retro:true,bone:true}:{sup:true,mid:true,deep:true,organ:false,retro:false,bone:true});\n  document.querySelectorAll(\'#layers>button[data-l="organ"],#layers>button[data-l="retro"]\').forEach(b=>b.hidden=!parts.some(p=>p.layer===b.dataset.l));')
rep('const l=ORDER.find(x=>x!=="bone"&&layerOn[x]);', 'const l=ORDER.find(x=>x!=="bone"&&layerOn[x]&&parts.some(p=>p.layer===x));')
rep('const l=[...ORDER].reverse().find(x=>x!=="bone"&&!layerOn[x]);', 'const l=[...ORDER].reverse().find(x=>x!=="bone"&&!layerOn[x]&&parts.some(p=>p.layer===x));')
rep('if(p.kind==="bone") ["sup","mid","deep"].forEach(l=>layerOn[l]=false);', 'if(p.kind==="bone") ["sup","mid","organ","retro","deep"].forEach(l=>layerOn[l]=false);')
# reveal: مثل البحث — يشيل الطبقات اللي فوگ الجزء ويأشّره (من زر «شوفه بالمجسّم» بالأشعة)
rep('window.Studio={open,select,color:colorOf};',
    '''function reveal(k){ const p=byKey[k]; if(!p) return; layerOn[p.layer]=true; hidden.delete(k);
  if(p.kind==="bone") ["sup","mid","organ","retro","deep"].forEach(l=>layerOn[l]=false);
  else ORDER.slice(0,ORDER.indexOf(p.layer)).forEach(l=>layerOn[l]=false);
  select(k,true); }
window.Studio={open,select,reveal,color:colorOf};''')

# كل مناطق الخريطة صارت متاحة، فما نحتاج «قريبًا» بدليل الألوان
rep('<span><i style="background:var(--accent)"></i>متاح الآن</span><span><i style="background:var(--body)"></i>قريبًا</span>',
    '<span><i style="background:var(--accent)"></i>كل الأجزاء متاحة</span>')

open(dst, "w", encoding="utf-8").write(h)
print("written", len(h))
