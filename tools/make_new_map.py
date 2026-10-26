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
    'const xrayReady=Promise.all([fetch("data/xray.json").then(r=>r.json()),fetch("data/xray-extra.json").then(r=>r.json()).catch(()=>({views:[],reuse:{}}))])\n  .then(([a,b])=>XRAY={...a,views:[...b.views,...a.views],reuse:b.reuse||{}});')
rep('const views=XRAY.views.filter(v=>v.region===r);',
    'const views=XRAY.views.filter(v=>v.region===r||(XRAY.reuse[r]||[]).includes(v.id));')

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

open(dst, "w", encoding="utf-8").write(h)
print("written", len(h))
