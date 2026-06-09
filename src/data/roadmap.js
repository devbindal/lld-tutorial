// The full Month 1 · Week 1 plan. `ready: true` means the tutorial component exists.
// As we build more days, flip ready to true and add the route in App.jsx.

export const COURSE = {
  title: 'Java LLD System Design',
  subtitle: 'Month 1 · Week 1 — Core OOP',
  weeks: [
    {
      id: 'w1',
      label: 'Week 1 · Core OOP',
      days: [
        { id: 1, slug: 'day1', title: 'Classes & Objects', sub: 'Blueprint vs building, constructors, this, access modifiers, static vs instance', ready: true },
        { id: 2, slug: 'day2', title: 'Encapsulation', sub: 'Getters/setters, immutability, defensive copying', ready: true },
        { id: 3, slug: 'day3', title: 'Inheritance', sub: 'is-a, overriding, super, constructor chaining', ready: true },
        { id: 4, slug: 'day4', title: 'Polymorphism', sub: 'Overloading vs overriding, dynamic dispatch, vtables', ready: false },
        { id: 5, slug: 'day5', title: 'Abstraction', sub: 'Abstract classes vs interfaces, default methods', ready: false },
      ],
    },
  ],
}

// flat list helper
export const ALL_DAYS = COURSE.weeks.flatMap((w) => w.days)
