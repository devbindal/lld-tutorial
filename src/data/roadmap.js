// The course plan: months → weeks → days. `ready: true` means the tutorial component exists.
// As we build more days, flip ready to true and add the route in App.jsx.
// Day files live in src/months/monthM/weekN/DayX.jsx — one folder per week.

export const COURSE = {
  title: 'Java LLD System Design',
  subtitle: '4-month roadmap to LLD mastery',
  months: [
    {
      id: 'm1',
      label: 'Month 1 · OOP Mastery + Design Fundamentals',
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
            { id: 9, slug: 'day9', title: 'UML Sequence Diagrams', sub: 'Who calls whom, in what order', ready: true },
            { id: 10, slug: 'day10', title: 'Requirements → Entities', sub: 'Turning a problem statement into classes and relationships', ready: true },
          ],
        },
        {
          id: 'w3',
          label: 'Week 3 · SOLID',
          days: [
            { id: 11, slug: 'day11', title: 'Single Responsibility Principle', sub: 'One class, one reason to change', ready: true },
            { id: 12, slug: 'day12', title: 'Open/Closed Principle', sub: 'Open for extension, closed for modification', ready: true },
            { id: 13, slug: 'day13', title: 'Liskov Substitution Principle', sub: 'Subtypes must honor the parent\'s promises', ready: true },
            { id: 14, slug: 'day14', title: 'Interface Segregation Principle', sub: 'Many small interfaces beat one fat one', ready: true },
            { id: 15, slug: 'day15', title: 'Dependency Inversion Principle', sub: 'Depend on abstractions, not concretions', ready: true },
          ],
        },
        {
          id: 'w4',
          label: 'Week 4 · Beyond SOLID',
          days: [
            { id: 16, slug: 'day16', title: 'DRY, KISS & YAGNI', sub: 'The three habits that keep code small and sane', ready: true },
            { id: 17, slug: 'day17', title: 'Coupling & Cohesion', sub: 'The two forces behind every design rule', ready: true },
            { id: 18, slug: 'day18', title: 'Law of Demeter', sub: 'Talk to friends, not strangers — no train wrecks', ready: true },
            { id: 19, slug: 'day19', title: 'Enums & Exception Design', sub: 'Modeling fixed sets and failures properly', ready: true },
            { id: 20, slug: 'day20', title: 'Value Objects', sub: 'Money, Address, DateRange — small immutable types', ready: true },
          ],
        },
      ],
    },
    {
      id: 'm2',
      label: 'Month 2 · Design Patterns (GoF)',
      weeks: [
        {
          id: 'w5',
          label: 'Week 5 · Creational Patterns',
          days: [
            { id: 21, slug: 'day21', title: 'Singleton', sub: 'One instance, global access — done right', ready: true },
            { id: 22, slug: 'day22', title: 'Factory Method', sub: 'Let subclasses decide what to create', ready: true },
            { id: 23, slug: 'day23', title: 'Abstract Factory', sub: 'Families of related objects', ready: true },
            { id: 24, slug: 'day24', title: 'Builder', sub: 'Step-by-step construction of complex objects', ready: true },
            { id: 25, slug: 'day25', title: 'Prototype', sub: 'Clone instead of construct', ready: true },
          ],
        },
        {
          id: 'w6',
          label: 'Week 6 · Structural Patterns',
          days: [
            { id: 26, slug: 'day26', title: 'Adapter', sub: 'The travel plug — make incompatible interfaces fit', ready: false },
            { id: 27, slug: 'day27', title: 'Decorator', sub: 'Wrap to add features, layer by layer', ready: false },
            { id: 28, slug: 'day28', title: 'Composite', sub: 'Treat trees of objects like single objects', ready: false },
            { id: 29, slug: 'day29', title: 'Facade & Proxy', sub: 'One simple front door; one guarding stand-in', ready: false },
            { id: 30, slug: 'day30', title: 'Flyweight & Bridge', sub: 'Share the heavy parts; split the hierarchies', ready: false },
          ],
        },
      ],
    },
  ],
}

// flat list helpers
export const ALL_WEEKS = COURSE.months.flatMap((m) => m.weeks)
export const ALL_DAYS = ALL_WEEKS.flatMap((w) => w.days)
