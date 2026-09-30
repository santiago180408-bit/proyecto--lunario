export const actions = [
  {
    intent: "pedir",
    title: "Pedir",
    description: "En Lunario o para recoger.",
    entryDescription: "Prepara tu pedido.",
    icon: "order",
    href: "/pedido",
  },
  {
    intent: "mesa",
    title: "Reservar mesa",
    description: "Envía tu solicitud de mesa.",
    entryDescription: "Elige fecha, hora y mesa.",
    icon: "table",
    href: "/reservar",
  },
  {
    intent: "coworking",
    title: "Reservar coworking",
    description: "Elige un espacio para trabajar.",
    entryDescription: "Elige espacio y modalidad.",
    icon: "coworking",
    href: "/coworking",
  },
] as const;
export const faq = [
  {
    question: "¿Puedo pedir para recoger?",
    answer:
      "Sí. En el sistema puedes elegir “Para recoger”, seleccionar tus productos y enviar tu solicitud.",
    icon: "order",
  },
  {
    question: "¿Puedo reservar una mesa?",
    answer:
      "Sí. Puedes elegir fecha, hora y número de personas, seleccionar una mesa y enviar tu solicitud de reservación.",
    icon: "table",
  },
  {
    question: "¿Lunario tiene coworking?",
    answer:
      "Sí. Lunario cuenta con espacios de coworking y puedes enviar una solicitud desde el sistema.",
    icon: "coworking",
  },
  {
    question: "¿Cómo funciona la reservación?",
    answer:
      "Eliges fecha, hora y personas, seleccionas una mesa o espacio y envías la solicitud. La reservación queda pendiente de confirmación.",
    icon: "table",
  },
] as const;
export const business = {
  name: "Lunario Café",
  address: "Pedro de Ponce #29, Col. Sidena, Cd. Sahagún, Hgo.",
  phone: "771 181 1972",
  email: "lunariocb@gmail.com",
  social: "@lunario_cafe",
  hours: "Lunes a domingo · 07:00–23:00",
  coffeeTime: "Lunes a domingo · 07:00–22:00",
};
