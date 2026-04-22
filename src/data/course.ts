import type { Course } from "../lib/types";

export const sampleCourse: Course = {
  id: "web-security-101",
  title: "Web Security Fundamentals",
  modules: [
    {
      id: "m1",
      title: "Injection",
      lessons: [
        { id: "l1", title: "What is SQL injection?", minutes: 8, body: "Untrusted input concatenated into a query lets attackers change its meaning. Parameterised queries keep data and code separate." },
        {
          id: "l2", title: "Defences in depth", minutes: 12, body: "Parameterise queries, use least-privilege database roles and validate input at the boundary.",
          quiz: {
            id: "q-injection", passMark: 0.7,
            questions: [
              { id: "q1", kind: "single", prompt: "What is the primary defence against SQL injection?", options: ["Escaping quotes", "Parameterised queries", "A web application firewall"], answer: 1, explanation: "Parameters are never parsed as SQL." },
              { id: "q2", kind: "multi", prompt: "Which reduce the impact of a successful injection?", options: ["Least-privilege DB user", "Verbose error pages", "Row Level Security", "Running as superuser"], answer: [0, 2], explanation: "Limit what a compromised query can reach." },
            ],
          },
        },
      ],
    },
    {
      id: "m2",
      title: "Sessions",
      lessons: [{ id: "l3", title: "Cookies done right", minutes: 10, body: "Use HttpOnly, Secure and SameSite cookies; rotate session IDs on login." }],
    },
  ],
};
