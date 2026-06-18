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
          recap: { slug: 'w1', sub: 'Core OOP — classes, encapsulation, inheritance, polymorphism, abstraction', ready: true },
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
          recap: { slug: 'w2', sub: 'Relationships, UML & turning requirements into entities', ready: true },
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
          recap: { slug: 'w3', sub: 'SOLID — the five principles, with refactors', ready: true },
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
          recap: { slug: 'w4', sub: 'Beyond SOLID — DRY/KISS/YAGNI, coupling, Demeter, enums, value objects', ready: true },
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
          recap: { slug: 'w5', sub: 'Creational patterns — Singleton, Factory, Abstract Factory, Builder, Prototype', ready: true },
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
          recap: { slug: 'w6', sub: 'Structural patterns — Adapter, Decorator, Composite, Facade/Proxy, Flyweight/Bridge', ready: true },
          days: [
            { id: 26, slug: 'day26', title: 'Adapter', sub: 'The travel plug — make incompatible interfaces fit', ready: true },
            { id: 27, slug: 'day27', title: 'Decorator', sub: 'Wrap to add features, layer by layer', ready: true },
            { id: 28, slug: 'day28', title: 'Composite', sub: 'Treat trees of objects like single objects', ready: true },
            { id: 29, slug: 'day29', title: 'Facade & Proxy', sub: 'One simple front door; one guarding stand-in', ready: true },
            { id: 30, slug: 'day30', title: 'Flyweight & Bridge', sub: 'Share the heavy parts; split the hierarchies', ready: true },
          ],
        },
        {
          id: 'w7',
          label: 'Week 7 · Behavioral Patterns I',
          recap: { slug: 'w7', sub: 'Behavioral I — Strategy, Observer, Command, State, Template Method', ready: true },
          days: [
            { id: 31, slug: 'day31', title: 'Strategy', sub: 'Swap the algorithm behind one interface', ready: true },
            { id: 32, slug: 'day32', title: 'Observer', sub: 'Publish, subscribe, never poll', ready: true },
            { id: 33, slug: 'day33', title: 'Command', sub: 'Requests as objects — queues, undo, redo', ready: true },
            { id: 34, slug: 'day34', title: 'State', sub: 'Objects that change behavior as they change state', ready: true },
            { id: 35, slug: 'day35', title: 'Template Method', sub: 'The fixed skeleton with pluggable steps', ready: true },
          ],
        },
        {
          id: 'w8',
          label: 'Week 8 · Behavioral Patterns II',
          recap: { slug: 'w8', sub: 'Behavioral II — Chain, Iterator, Mediator, Memento, Visitor', ready: true },
          days: [
            { id: 36, slug: 'day36', title: 'Chain of Responsibility', sub: 'Pass the request down the line until someone handles it', ready: true },
            { id: 37, slug: 'day37', title: 'Iterator', sub: 'Walk any collection without knowing its insides', ready: true },
            { id: 38, slug: 'day38', title: 'Mediator', sub: 'Colleagues talk through the hub, never directly', ready: true },
            { id: 39, slug: 'day39', title: 'Memento', sub: 'Bottle an object\'s state; restore it later', ready: true },
            { id: 40, slug: 'day40', title: 'Visitor', sub: 'New operations over old structures — without editing them', ready: true },
          ],
        },
      ],
    },
    {
      id: 'm3',
      label: 'Month 3 · Classic LLD Problems',
      weeks: [
        {
          id: 'w9',
          label: 'Week 9 · First Classics',
          recap: { slug: 'w9', sub: 'First classics — Parking Lot, Tic-Tac-Toe, Snake & Ladder', ready: false },
          days: [
            { id: 41, slug: 'day41', title: 'Parking Lot — Part 1', sub: 'Requirements → entities → design, the famous interview opener', ready: true },
            { id: 42, slug: 'day42', title: 'Parking Lot — Part 2', sub: 'Code walkthrough, pricing strategies, variations', ready: true },
            { id: 43, slug: 'day43', title: 'Tic-Tac-Toe', sub: 'Board games done cleanly — turns, wins, extensibility', ready: true },
            { id: 44, slug: 'day44', title: 'Snake & Ladder', sub: 'Dice, jumpers and the game-loop skeleton', ready: true },
            { id: 45, slug: 'day45', title: 'Week 9 Machine-Coding Drill', sub: 'Timed practice + review checklist', ready: true },
          ],
        },
        {
          id: 'w10',
          label: 'Week 10 · Machines & Frameworks',
          recap: { slug: 'w10', sub: 'Machines & frameworks — Elevator, Vending Machine, Logging', ready: false },
          days: [
            { id: 46, slug: 'day46', title: 'Elevator — Part 1', sub: 'Requirements, state machine, and the scheduling problem', ready: true },
            { id: 47, slug: 'day47', title: 'Elevator — Part 2', sub: 'Scheduling strategies in code, multi-car dispatch', ready: true },
            { id: 48, slug: 'day48', title: 'Vending Machine', sub: 'The State pattern’s flagship problem', ready: true },
            { id: 49, slug: 'day49', title: 'Logging Framework', sub: 'Chain of Responsibility + appenders done right', ready: true },
            { id: 50, slug: 'day50', title: 'Week 10 Machine-Coding Drill', sub: 'Timed practice + review checklist', ready: true },
          ],
        },
        {
          id: 'w11',
          label: 'Week 11 · Big Systems',
          recap: { slug: 'w11', sub: 'Big systems — BookMyShow, Splitwise, ATM', ready: false },
          days: [
            { id: 51, slug: 'day51', title: 'BookMyShow — Part 1', sub: 'Movie/seat booking: entities and the concurrency problem', ready: true },
            { id: 52, slug: 'day52', title: 'BookMyShow — Part 2', sub: 'Seat locking, payment, and booking expiry', ready: true },
            { id: 53, slug: 'day53', title: 'Splitwise', sub: 'Expense splitting, balances and settle-up', ready: true },
            { id: 54, slug: 'day54', title: 'ATM', sub: 'State machine, cash dispensing, transactions', ready: true },
            { id: 55, slug: 'day55', title: 'Week 11 Machine-Coding Drill', sub: 'Timed practice + review checklist', ready: true },
          ],
        },
        {
          id: 'w12',
          label: 'Week 12 · Data Structures & + buffer',
          days: [
            { id: 56, slug: 'day56', title: 'LRU Cache', sub: 'O(1) get/put with HashMap + doubly-linked list', ready: true },
            { id: 57, slug: 'day57', title: 'Notification System', sub: 'Channels, templates, and pluggable delivery', ready: true },
            { id: 58, slug: 'day58', title: 'Cab Booking — Part 1', sub: 'Matching riders & drivers, trip lifecycle', ready: true },
            { id: 59, slug: 'day59', title: 'Cab Booking — Part 2', sub: 'Pricing, dispatch strategies, surge', ready: false },
            { id: 60, slug: 'day60', title: 'Week 12 Machine-Coding Drill', sub: 'Timed practice + Month 3 recap', ready: false },
          ],
        },
      ],
    },
  ],
}

// flat list helpers
export const ALL_WEEKS = COURSE.months.flatMap((m) => m.weeks)
export const ALL_DAYS = ALL_WEEKS.flatMap((w) => w.days)
