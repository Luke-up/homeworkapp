"""Shared graph of demo teachers, students, classes, homework (used by seed_demo + timed demos)."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from typing import Optional

from django.utils import timezone

from core.models import (
    Class,
    Homework,
    School,
    Student,
    StudentHomework,
    Teacher,
    User,
    Word,
)
from core.student_homework_answers import merge_student_answer_rows

# Stable Unsplash URLs for seeded homework covers (reading / science themes).
_COVER = {
    "wildlife": "https://images.unsplash.com/photo-1456923300659-edede1a495a6?auto=format&fit=crop&w=1200&q=80",
    "ocean": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
    "mountains": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    "lab": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    "forest": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    "plants": "https://images.unsplash.com/photo-1466692476869-a02e180b26a0?auto=format&fit=crop&w=1200&q=80",
    "classroom": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    "books": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
    "river": "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80",
    "writing": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
}


def demo_teacher_email(tag: Optional[str], index: int) -> str:
    if tag:
        return f"demo-{tag}-teacher{index}@example.com"
    return f"demo-teacher{index}@example.com"


def demo_student_email(tag: Optional[str], index: int) -> str:
    if tag:
        return f"demo-{tag}-student{index}@example.com"
    return f"demo-student{index}@example.com"


def demo_answer_rows(homework: Homework) -> list:
    qs = homework.questions if isinstance(homework.questions, list) else []
    placeholders = [
        {"answer": f"Demo answer {i + 1}: I used details from the reading to respond here."}
        for i in range(len(qs))
    ]
    return merge_student_answer_rows(qs, placeholders)


def set_submitted_with_answers(sh: StudentHomework) -> None:
    sh.answers = demo_answer_rows(sh.homework)
    sh.submitted = True
    sh.submission_date = timezone.now()
    sh.save()


def apply_demo_mark(student: Student, sh: StudentHomework, mark_value: Decimal, teacher_comment: str) -> None:
    mv = Decimal(str(mark_value))
    sh.answers = demo_answer_rows(sh.homework)
    sh.submitted = True
    sh.marked = True
    sh.mark_value = mv
    sh.submission_date = timezone.now()
    sh.teacher_comment = teacher_comment
    sh.save()
    current = Decimal(student.effort_symbol)
    student.effort_symbol = round(
        (current / Decimal("5") * Decimal("4")) + (mv / Decimal("5")),
        2,
    )
    student.save(update_fields=["effort_symbol"])


def populate_demo_school(school: School, password: str, *, email_tag: Optional[str] = None) -> None:
    """
    Fill an existing school with the standard demo dataset.
    ``school.user`` must already exist. All new users share ``password``.
    ``email_tag`` groups emails for isolated timed demos; None uses legacy CLI demo addresses.
    """
    t1_user = User.objects.create_user(
        email=demo_teacher_email(email_tag, 1),
        password=password,
        name="Alex Teacher",
        user_type="teacher",
    )
    t2_user = User.objects.create_user(
        email=demo_teacher_email(email_tag, 2),
        password=password,
        name="Jordan Teacher",
        user_type="teacher",
    )
    teacher1 = Teacher.objects.create(user=t1_user, school=school, name="Alex Teacher")
    teacher2 = Teacher.objects.create(user=t2_user, school=school, name="Jordan Teacher")

    students_data = [
        (demo_student_email(email_tag, 1), "Sam Student"),
        (demo_student_email(email_tag, 2), "Riley Student"),
        (demo_student_email(email_tag, 3), "Casey Student"),
    ]
    students = []
    for email, name in students_data:
        u = User.objects.create_user(
            email=email,
            password=password,
            name=name,
            user_type="student",
        )
        students.append(Student.objects.create(user=u, school=school, name=name))

    c1 = Class.objects.create(
        school=school,
        name="Advanced class",
        description="Demo class",
        level=9,
    )
    c2 = Class.objects.create(
        school=school,
        name="Beginner class",
        description="Second demo class",
        level=10,
    )
    c1.teachers.add(teacher1)
    c2.teachers.add(teacher1, teacher2)
    c1.students.add(students[0], students[1])
    c2.students.add(students[1], students[2])

    today = timezone.localdate()

    w1 = Word.objects.create(
        word="adaptations",
        example_sentence="Animals have many adaptations to survive in their environment.",
    )
    w2 = Word.objects.create(word="prey", example_sentence="Many animals are prey for other animals.")
    w3 = Word.objects.create(word="predators", example_sentence="Predators hunt prey for food.")
    w4 = Word.objects.create(word="habitat", example_sentence="The animal lives in a specific habitat.")
    w5 = Word.objects.create(
        word="survival",
        example_sentence="The animal has adapted to survive in its environment.",
    )
    w6 = Word.objects.create(
        word="photosynthesis",
        example_sentence="Plants use photosynthesis to turn light into chemical energy.",
    )
    w7 = Word.objects.create(
        word="chlorophyll",
        example_sentence="Chlorophyll gives leaves their green colour and captures light.",
    )
    w8 = Word.objects.create(
        word="ecosystem",
        example_sentence="An ecosystem links living things with the air, water, and soil around them.",
    )
    w9 = Word.objects.create(
        word="biodiversity",
        example_sentence="Biodiversity describes the variety of life found in one place.",
    )
    w10 = Word.objects.create(
        word="nutrients",
        example_sentence="Nutrients move through food webs when organisms eat and are eaten.",
    )
    w11 = Word.objects.create(
        word="evaporation",
        example_sentence="Evaporation lifts water from lakes and oceans into the atmosphere.",
    )
    w12 = Word.objects.create(
        word="condensation",
        example_sentence="Condensation forms clouds when water vapour cools and gathers into droplets.",
    )
    w13 = Word.objects.create(
        word="precipitation",
        example_sentence="Precipitation returns water to the ground as rain or snow.",
    )
    w14 = Word.objects.create(
        word="watershed",
        example_sentence="A watershed is the land area that drains into one river system.",
    )
    w15 = Word.objects.create(
        word="erosion",
        example_sentence="Erosion slowly moves soil and rock downhill with wind and water.",
    )
    w16 = Word.objects.create(
        word="sediment",
        example_sentence="Sediment settles in calm water and builds new layers over time.",
    )

    reading_vocab = (
        "Animals have many adaptations to survive in their environment. There are many different types "
        "of animals and they all have different adaptations. Some animals have adaptations to help them "
        "find food, some have adaptations to help them find water, some have adaptations to help them find "
        "shelter, and some have adaptations to help them find mates. Predators have adaptations to help "
        "them hunt prey, and prey have adaptations to help them escape predators. Habitat is the environment "
        "where an animal lives, and survival is the ability of an animal to survive in its environment."
    )

    hw_open_1 = Homework.objects.create(
        title="Vocabulary: adaptations and habitats",
        level=9,
        class_field=c1,
        cover_image_url=_COVER["wildlife"],
        due_date=today + timedelta(days=10),
        reading=reading_vocab,
        summary="Incredible animals have incredible adaptations to survive in their environment.",
        questions=[
            {
                "q": "Animals have many adaptations to survive in their environment. What are some of these adaptations?",
                "type": "short",
            },
            {
                "q": "Predators have adaptations to help them hunt prey. What are some of these adaptations?",
                "type": "short",
            },
            {
                "q": "Prey have adaptations to help them escape predators. What are some of these adaptations?",
                "type": "short",
            },
            {
                "q": "Habitat is the environment where an animal lives. What are some of the different types of habitats?",
                "type": "short",
            },
        ],
    )
    hw_open_1.words.set([w1, w2, w3, w4])

    hw_open_2 = Homework.objects.create(
        title="Science reading: water cycle basics",
        level=9,
        class_field=c1,
        cover_image_url=_COVER["ocean"],
        due_date=today + timedelta(days=17),
        reading=(
            "Water moves between the land, ocean, and sky in a continuous cycle. Evaporation lifts moisture "
            "from warm surfaces, condensation builds clouds high in the atmosphere, and precipitation returns "
            "fresh water to plants and rivers. A watershed collects rainfall and guides it toward streams "
            "that eventually reach the sea."
        ),
        summary="Follow one drop of water through evaporation, condensation, and precipitation.",
        questions=[
            {"q": "Describe evaporation in your own words.", "type": "short"},
            {"q": "What happens during condensation?", "type": "short"},
            {"q": "Give one example of precipitation.", "type": "short"},
            {"q": "Why does a watershed matter for clean water?", "type": "short"},
        ],
    )
    hw_open_2.words.set([w11, w12, w13, w14])

    hw_open_3 = Homework.objects.create(
        title="Earth systems: erosion and sediment",
        level=9,
        class_field=c1,
        cover_image_url=_COVER["mountains"],
        due_date=today + timedelta(days=24),
        reading=(
            "Wind and water sculpt landscapes over long periods. Erosion loosens grains of rock and soil "
            "and carries them downhill. When the flow slows, sediment drops out and forms layered deposits "
            "in valleys and deltas. Biodiversity often increases where new soils build because plants "
            "find space to root and animals follow the food."
        ),
        summary="Connect erosion, sediment movement, and living communities.",
        questions=[
            {"q": "What is erosion?", "type": "short"},
            {"q": "Where might sediment collect after a flood?", "type": "short"},
            {"q": "How can new sediment help plants?", "type": "short"},
            {"q": "Name one way people can reduce harmful erosion.", "type": "short"},
        ],
    )
    hw_open_3.words.set([w8, w9, w10, w15, w16])

    hw_pending_1 = Homework.objects.create(
        title="Lab write-up: observing an ecosystem jar",
        level=9,
        class_field=c1,
        cover_image_url=_COVER["lab"],
        due_date=today + timedelta(days=12),
        reading=(
            "A closed jar can model a tiny ecosystem when soil, water, air, and a few plants share the same "
            "space. Nutrients cycle as leaves fall and bacteria break them down. Predators and prey may be "
            "small insects instead of large mammals, but the same vocabulary still applies."
        ),
        summary="Draft your observations before the teacher reviews your method section.",
        questions=[
            {"q": "List two abiotic factors you measured.", "type": "short"},
            {"q": "Describe one interaction between living things in the jar.", "type": "short"},
            {"q": "How did nutrients appear to move in your model?", "type": "short"},
            {"q": "What would you change in a second trial?", "type": "short"},
        ],
    )
    hw_pending_1.words.set([w1, w3, w8, w10])

    hw_pending_2 = Homework.objects.create(
        title="Opinion paragraph: protecting biodiversity",
        level=9,
        class_field=c1,
        cover_image_url=_COVER["forest"],
        due_date=today + timedelta(days=19),
        reading=(
            "Protecting biodiversity means keeping many species healthy in the same region. When one habitat "
            "disappears, predators lose prey, prey lose cover, and nutrients stop cycling as efficiently. "
            "Small parks connected by corridors can help animals move safely between larger wild spaces."
        ),
        summary="Write a short opinion piece with evidence from the reading.",
        questions=[
            {"q": "State your opinion in one clear sentence.", "type": "short"},
            {"q": "Give two facts from the text that support your view.", "type": "short"},
            {"q": "Suggest one action your community could take.", "type": "short"},
            {"q": "What counterargument might someone raise?", "type": "short"},
        ],
    )
    hw_pending_2.words.set([w2, w4, w5, w9])

    reading_plants = (
        "Plants capture sunlight using chlorophyll inside their leaves. Through photosynthesis they combine "
        "carbon dioxide and water to make sugars and release oxygen. Without this process, most food webs on "
        "land would collapse because animals ultimately rely on plant energy stored in leaves, roots, and fruits."
    )
    hw_marked_lexicon = Homework.objects.create(
        title="Science reading: plants and energy",
        level=9,
        class_field=c1,
        cover_image_url=_COVER["plants"],
        due_date=today + timedelta(days=5),
        reading=reading_plants,
        summary="Foundations of energy in living things.",
        questions=[
            {"q": "What is photosynthesis in one sentence?", "type": "short"},
            {"q": "Why is chlorophyll important for leaves?", "type": "short"},
            {"q": "Name one product plants release during photosynthesis.", "type": "short"},
            {"q": "How do animals depend on plant energy indirectly?", "type": "short"},
        ],
    )
    hw_marked_lexicon.words.set([w6, w7, w8, w9])

    reading_c2 = (
        "Beginner classes revisit core vocabulary slowly. Photosynthesis, chlorophyll, predators, and prey "
        "appear again so students can connect ideas across units. Short readings keep the focus on clear "
        "sentences and confident recall before longer tasks return later in the term."
    )
    hw_c2_open = Homework.objects.create(
        title="Review: core vocabulary recall",
        level=10,
        class_field=c2,
        cover_image_url=_COVER["classroom"],
        due_date=today + timedelta(days=14),
        reading=reading_c2,
        summary="Warm-up reading for the beginner cohort.",
        questions=[
            {"q": "Define photosynthesis using the reading.", "type": "short"},
            {"q": "What does chlorophyll do?", "type": "short"},
            {"q": "Contrast predator and prey with one example each.", "type": "short"},
            {"q": "Which habitat example did you find clearest?", "type": "short"},
        ],
    )
    hw_c2_open.words.set([w6, w7, w2, w3])

    hw_c2_open_b = Homework.objects.create(
        title="Beginner reading: food webs",
        level=10,
        class_field=c2,
        cover_image_url=_COVER["books"],
        due_date=today + timedelta(days=21),
        reading=(
            "A food web links many food chains. Producers start the flow of nutrients, herbivores eat plants, "
            "and carnivores may eat herbivores. Decomposers release nutrients back to the soil so producers "
            "can use them again."
        ),
        summary="Trace energy through a simple food web.",
        questions=[
            {"q": "Name one producer from the reading.", "type": "short"},
            {"q": "Name one herbivore or plant-eater role.", "type": "short"},
            {"q": "What do decomposers add to the cycle?", "type": "short"},
            {"q": "Draw or describe one chain from the web in words.", "type": "short"},
        ],
    )
    hw_c2_open_b.words.set([w1, w8, w10, w14])

    hw_c2_open_c = Homework.objects.create(
        title="Beginner reading: watershed safety",
        level=10,
        class_field=c2,
        cover_image_url=_COVER["river"],
        due_date=today + timedelta(days=28),
        reading=(
            "Keeping a watershed healthy means reducing litter, planting trees on slopes, and preventing "
            "chemicals from washing into streams. Precipitation carries anything on the ground toward rivers, "
            "so small actions upstream protect drinking water downstream."
        ),
        summary="Connect human choices to watershed health.",
        questions=[
            {"q": "Give two ways people protect watersheds.", "type": "short"},
            {"q": "How can precipitation spread pollution?", "type": "short"},
            {"q": "Why do trees on slopes matter?", "type": "short"},
            {"q": "What question do you still have about watersheds?", "type": "short"},
        ],
    )
    hw_c2_open_c.words.set([w11, w13, w14, w15])

    reading_c2_mark = (
        "Riley and Casey practise summarising short paragraphs. They underline predators, prey, and habitat "
        "each time those words appear. Teachers use this short text to calibrate marks before longer essays "
        "arrive later in the semester."
    )
    hw_c2_marked = Homework.objects.create(
        title="Marked warm-up: summary skills",
        level=10,
        class_field=c2,
        cover_image_url=_COVER["writing"],
        due_date=today + timedelta(days=7),
        reading=reading_c2_mark,
        summary="Completed item so beginner dashboards show lexicon growth.",
        questions=[
            {"q": "Write one sentence summarising the reading.", "type": "short"},
            {"q": "List the three vocabulary words you were asked to notice.", "type": "short"},
            {"q": "Why might a teacher use a short text first?", "type": "short"},
            {"q": "What will you focus on in the next longer essay?", "type": "short"},
        ],
    )
    hw_c2_marked.words.set([w2, w3, w4, w5])

    all_demo_hw = (
        hw_open_1,
        hw_open_2,
        hw_open_3,
        hw_pending_1,
        hw_pending_2,
        hw_marked_lexicon,
        hw_c2_open,
        hw_c2_open_b,
        hw_c2_open_c,
        hw_c2_marked,
    )
    for hw in all_demo_hw:
        for student in hw.class_field.students.all():
            sh_row, _ = StudentHomework.objects.get_or_create(student=student, homework=hw)
            sh_row.save()

    sh_sam_marked = StudentHomework.objects.get(student=students[0], homework=hw_marked_lexicon)
    apply_demo_mark(
        students[0],
        sh_sam_marked,
        Decimal("4.50"),
        "Excellent use of vocabulary from the reading — push your explanations one step further next time.",
    )

    sh_sam_pending_a = StudentHomework.objects.get(student=students[0], homework=hw_pending_1)
    set_submitted_with_answers(sh_sam_pending_a)

    sh_sam_pending_b = StudentHomework.objects.get(student=students[0], homework=hw_pending_2)
    set_submitted_with_answers(sh_sam_pending_b)

    riley = students[1]
    skip_new = {hw_open_1.id, hw_open_2.id}
    for sh in StudentHomework.objects.filter(student=riley).select_related("homework"):
        if sh.homework_id in skip_new:
            continue
        if sh.homework_id == hw_c2_marked.id:
            continue
        set_submitted_with_answers(sh)

    sh_riley_marked = StudentHomework.objects.get(student=riley, homework=hw_c2_marked)
    apply_demo_mark(
        riley,
        sh_riley_marked,
        Decimal("3.75"),
        "Clear summaries — tighten the links between vocabulary and the main idea of each paragraph.",
    )

    sh_casey_marked = StudentHomework.objects.get(student=students[2], homework=hw_c2_marked)
    apply_demo_mark(
        students[2],
        sh_casey_marked,
        Decimal("4.00"),
        "Well organised answers; keep quoting short phrases from the text to support your points.",
    )
