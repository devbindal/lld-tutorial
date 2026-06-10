// The Month 1 plan. `ready: true` means the tutorial component exists.
// As we build more days, flip ready to true and add the route in App.jsx.
// Day files live in src/weeks/weekN/DayX.jsx — one folder per week.

export const COURSE = {
  title: 'Java LLD System Design',
  subtitle: 'Month 1 — OOP Mastery + Design Fundamentals',
  weeks: [
    {
      id: 'w1',
      label: 'Week 1 · Core OOP',
      days: [
        { id: 1, slug: 'day1', title: 'Classes & Objects', sub: 'Blueprint vs building, constructors, this, access modifiers, static vs instance', ready: true },
        { id: 2, slug: 'day2', title: 'Encapsulation', sub: 'Getters/setters, immutability, defensive copying', ready: true },
        { id: 3, slug: 'day3', title: 'Inheritance', sub: 'is-a, overriding, super, constructor chaining', ready: true },
        { id: 4, slug: 'day4', title: 'Polymorphism', sub: 'Overloading vs overriding, dynamic dispatch, vtables', ready: true },
        { id: 5, slug: 'day5', title: 'Abstraction', sub: 'Abstract classes vs interfaces, default methods', ready: true },
      ],
    },
    {
      id: 'w2',
      label: 'Week 2 · Relationships, UML & Object Modeling',
      days: [
        { id: 6, slug: 'day6', title: 'Association, Aggregation & Composition', sub: 'has-a relationships, ownership, lifecycles — how objects connect', ready: true },
        { id: 7, slug: 'day7', title: 'Dependency & Composition over Inheritance', sub: 'uses-a, coupling, why has-a beats is-a', ready: true },
        { id: 8, slug: 'day8', title: 'UML Class Diagrams', sub: 'Boxes, arrows, multiplicity — drawing your design', ready: true },
        { id: 9, slug: 'day9', title: 'UML Sequence Diagrams', sub: 'Who calls whom, in what order', ready: false },
        { id: 10, slug: 'day10', title: 'Requirements → Entities', sub: 'Turning a problem statement into classes and relationships', ready: false },
      ],
    },
  ],
}

// flat list helper
export const ALL_DAYS = COURSE.weeks.flatMap((w) => w.days)
