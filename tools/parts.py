# أجزاء الطرف العلوي الأيسر من BodyParts3D (isa_BP3D_4.0)
# كل جزء: (اسمه بقائمة BodyParts3D، الاسم المعروض بالإنكليزي، العربي، المجموعة)
# الاسم المعروض حسب Terminologia Anatomica، والمجموعة تحدد لون الجزء وترتيبه بالقائمة

BONES = {
    "arm": [
        (["left humerus"], "Humerus", "عظم العضد", "bone"),
    ],
    "forearm": [
        (["left radius"], "Radius", "الكعبرة", "bone"),
        (["left ulna"], "Ulna", "الزند", "bone"),
        (["interosseous membrane of left forearm"], "Interosseous membrane", "الغشاء بين العظمين", "membrane"),
    ],
    "hand": [
        (["left scaphoid"], "Scaphoid", "الزورقي", "carpal-p"),
        (["left lunate"], "Lunate", "الهلالي", "carpal-p"),
        (["left triquetral"], "Triquetrum", "المثلثي", "carpal-p"),
        (["left pisiform"], "Pisiform", "الحِمَّصي", "carpal-p"),
        (["left trapezium"], "Trapezium", "المربع المنحرف", "carpal-d"),
        (["left trapezoid"], "Trapezoid", "شبه المنحرف", "carpal-d"),
        (["left capitate"], "Capitate", "الكبير (الرأسي)", "carpal-d"),
        (["left hamate"], "Hamate", "الكُلّابي", "carpal-d"),
        (["left first metacarpal bone"], "1st metacarpal", "عظم المشط الأول", "metacarpal"),
        (["left second metacarpal bone"], "2nd metacarpal", "عظم المشط الثاني", "metacarpal"),
        (["left third metacarpal bone"], "3rd metacarpal", "عظم المشط الثالث", "metacarpal"),
        (["left fourth metacarpal bone"], "4th metacarpal", "عظم المشط الرابع", "metacarpal"),
        (["left fifth metacarpal bone"], "5th metacarpal", "عظم المشط الخامس", "metacarpal"),
        (["proximal phalanx of left thumb"], "Proximal phalanx — thumb", "السلامى الدانية — الإبهام", "phalanx"),
        (["distal phalanx of left thumb"], "Distal phalanx — thumb", "السلامى القاصية — الإبهام", "phalanx"),
        (["proximal phalanx of left index finger"], "Proximal phalanx — index", "السلامى الدانية — السبابة", "phalanx"),
        (["middle phalanx of left index finger"], "Middle phalanx — index", "السلامى الوسطى — السبابة", "phalanx"),
        (["distal phalanx of left index finger"], "Distal phalanx — index", "السلامى القاصية — السبابة", "phalanx"),
        (["proximal phalanx of left middle finger"], "Proximal phalanx — middle", "السلامى الدانية — الوسطى", "phalanx"),
        (["middle phalanx of left middle finger"], "Middle phalanx — middle", "السلامى الوسطى — الوسطى", "phalanx"),
        (["distal phalanx of left middle finger"], "Distal phalanx — middle", "السلامى القاصية — الوسطى", "phalanx"),
        (["proximal phalanx of left ring finger"], "Proximal phalanx — ring", "السلامى الدانية — البنصر", "phalanx"),
        (["middle phalanx of left ring finger"], "Middle phalanx — ring", "السلامى الوسطى — البنصر", "phalanx"),
        (["distal phalanx of left ring finger"], "Distal phalanx — ring", "السلامى القاصية — البنصر", "phalanx"),
        (["proximal phalanx of left little finger"], "Proximal phalanx — little", "السلامى الدانية — الخنصر", "phalanx"),
        (["middle phalanx of left little finger"], "Middle phalanx — little", "السلامى الوسطى — الخنصر", "phalanx"),
        (["distal phalanx of left little finger"], "Distal phalanx — little", "السلامى القاصية — الخنصر", "phalanx"),
    ],
}

MUSCLES = {
    "arm": [
        (["short head of left biceps brachii"], "Biceps brachii — short head", "ذات الرأسين العضدية — الرأس القصير", "anterior"),
        (["long head of left biceps brachii"], "Biceps brachii — long head", "ذات الرأسين العضدية — الرأس الطويل", "anterior"),
        (["left brachialis"], "Brachialis", "العضلة العضدية", "anterior"),
        (["left coracobrachialis"], "Coracobrachialis", "الغرابية العضدية", "anterior"),
        (["long head of left triceps brachii"], "Triceps brachii — long head", "ثلاثية الرؤوس العضدية — الرأس الطويل", "posterior"),
        (["lateral head of left triceps brachii"], "Triceps brachii — lateral head", "ثلاثية الرؤوس العضدية — الرأس الوحشي", "posterior"),
        (["medial head of left triceps brachii"], "Triceps brachii — medial head", "ثلاثية الرؤوس العضدية — الرأس الإنسي", "posterior"),
    ],
    "forearm": [
        (["humeral head of left pronator teres", "ulnar head of left pronator teres"], "Pronator teres", "الكابّة المدوّرة", "anterior"),
        (["left flexor carpi radialis"], "Flexor carpi radialis", "المثنية الكعبرية للرسغ", "anterior"),
        (["left palmaris longus"], "Palmaris longus", "الراحية الطويلة", "anterior"),
        (["humeral head of left flexor carpi ulnaris", "ulnar head of left flexor carpi ulnaris"], "Flexor carpi ulnaris", "المثنية الزندية للرسغ", "anterior"),
        (["left flexor digitorum superficialis"], "Flexor digitorum superficialis", "المثنية السطحية للأصابع", "anterior"),
        (["left flexor digitorum profundus"], "Flexor digitorum profundus", "المثنية العميقة للأصابع", "anterior"),
        (["left flexor pollicis longus"], "Flexor pollicis longus", "المثنية الطويلة للإبهام", "anterior"),
        (["left pronator quadratus"], "Pronator quadratus", "الكابّة المربعة", "anterior"),
        (["left brachioradialis"], "Brachioradialis", "العضدية الكعبرية", "posterior"),
        (["left extensor carpi radialis longus"], "Extensor carpi radialis longus", "الباسطة الكعبرية الطويلة للرسغ", "posterior"),
        (["left extensor carpi radialis brevis"], "Extensor carpi radialis brevis", "الباسطة الكعبرية القصيرة للرسغ", "posterior"),
        (["left extensor digitorum"], "Extensor digitorum", "الباسطة للأصابع", "posterior"),
        (["left extensor digiti minimi"], "Extensor digiti minimi", "الباسطة للخنصر", "posterior"),
        (["left extensor carpi ulnaris"], "Extensor carpi ulnaris", "الباسطة الزندية للرسغ", "posterior"),
        (["left anconeus"], "Anconeus", "العضلة المرفقية", "posterior"),
        (["left supinator"], "Supinator", "العضلة الباطحة", "posterior"),
        (["left abductor pollicis longus"], "Abductor pollicis longus", "المبعِدة الطويلة للإبهام", "posterior"),
        (["left extensor pollicis brevis"], "Extensor pollicis brevis", "الباسطة القصيرة للإبهام", "posterior"),
        (["left extensor pollicis longus"], "Extensor pollicis longus", "الباسطة الطويلة للإبهام", "posterior"),
        (["left extensor indicis"], "Extensor indicis", "الباسطة للسبابة", "posterior"),
    ],
    "hand": [
        (["left abductor pollicis brevis"], "Abductor pollicis brevis", "المبعِدة القصيرة للإبهام", "thenar"),
        (["superficial head of left flexor pollicis brevis"], "Flexor pollicis brevis", "المثنية القصيرة للإبهام", "thenar"),
        (["left opponens pollicis"], "Opponens pollicis", "المقابِلة للإبهام", "thenar"),
        (["oblique head of left adductor pollicis", "transverse head of left adductor pollicis"], "Adductor pollicis", "المقرِّبة للإبهام", "thenar"),
        (["abductor digiti minimi of left hand"], "Abductor digiti minimi", "المبعِدة للخنصر", "hypothenar"),
        (["flexor digiti minimi brevis of left hand"], "Flexor digiti minimi brevis", "المثنية القصيرة للخنصر", "hypothenar"),
        (["opponens digiti minimi of left hand"], "Opponens digiti minimi", "المقابِلة للخنصر", "hypothenar"),
        (["set of lumbricals of left hand"], "Lumbricals", "العضلات الدودية", "central"),
        (["set of palmar interossei of left hand"], "Palmar interossei", "بين العظام الراحية", "central"),
        (["set of dorsal interossei of left hand"], "Dorsal interossei", "بين العظام الظهرية", "central"),
    ],
}

# عظام تظهر بمشهد العضلات حتى يعرف الطالب وين العضلة (رمادية وما تنضغط)
CONTEXT = {
    "arm": ["left humerus"],
    "forearm": ["left radius", "left ulna"],
    "hand": [n for p in BONES["hand"] for n in p[0]],
}
