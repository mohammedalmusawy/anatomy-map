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
open(dst, "w", encoding="utf-8").write(h)
print("written", len(h))
