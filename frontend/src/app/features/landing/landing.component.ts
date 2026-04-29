import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatbotWidgetComponent } from '../chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, CommonModule, FormsModule, ChatbotWidgetComponent ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  menuOpen   = false;
  isScrolled = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  stats = [
    { number: '50K+', label: 'Estudiantes activos',   icon: 'bi-people-fill'       },
    { number: '200+', label: 'Cursos disponibles',    icon: 'bi-play-circle-fill'  },
    { number: '98%',  label: 'Satisfacción',          icon: 'bi-star-fill'         },
    { number: '150+', label: 'Instructores expertos', icon: 'bi-person-badge-fill' },
  ];

  categories = [
    { icon: 'bi-code-slash',        name: 'Desarrollo Web',         courses: 48 },
    { icon: 'bi-phone',             name: 'Apps Móviles',           courses: 32 },
    { icon: 'bi-cpu',               name: 'Inteligencia Artificial', courses: 27 },
    { icon: 'bi-vector-pen',        name: 'Diseño UX/UI',           courses: 35 },
    { icon: 'bi-bar-chart-fill',    name: 'Data Science',           courses: 29 },
    { icon: 'bi-shield-lock-fill',  name: 'Ciberseguridad',         courses: 21 },
  ];
plans = [
  {
    name:    'Básico',
    price:   '9.99',
    period:  'mes',
    type:    'basic',
    popular: false,
    icon:    'bi-rocket',
    features: [
      { text: '200 Tokens mensuales',           included: true  },
      { text: 'Material a disposición', included: true  },
      { text: 'Soporte por email (48h)',        included: true  },
      { text: 'Certificados digitales estándar', included: true  },
      { text: 'Tokens acumulables',             included: false },
      { text: 'Consultas directas a instructores', included: false },
      { text: 'Certificación avalada por el Estado', included: false },
    ],
  },
  {
    name:    'Pro',
    price:   '19.99',
    period:  'mes',
    type:    'pro',
    popular: true,
    icon:    'bi-rocket-takeoff-fill',
    features: [
      { text: '600 Tokens mensuales',           included: true },
      { text: 'Tokens acumulables (sin límite)', included: true },
      { text: 'Soporte prioritario',       included: true },
      { text: 'Bonificación de tokens extra por mantener la subscripción', included: true },
      { text: 'Descuentos en compra de tokens extra', included: true },
      { text: 'Certificados digitales personalizados', included: true },
      { text: 'Certificación avalada por el Estado', included: false },
    ],
  },
  {
    name:    'Premium',
    price:   '69.99',
    period:  'mes',
    type:    'enterprise',
    popular: false,
    icon:    'bi-gem',
    features: [
      { text: 'Todo lo incluido en el plan Pro',      included: true },
      { text: 'Tokens ilimitados (Todo el catálogo)', included: true },
      { text: 'Certificación avalada por el Estado',  included: true },
      { text: 'Acceso anticipado a nuevos cursos',    included: true },
      { text: 'Intentos ilimitados en exámenes',      included: true },
      { text: 'Perfil de estudiante destacado',       included: true },
      { text: 'Consulta a instructores', included: true },
      { text: 'Y mucho más...',     included: true },
    ],
},
];

  testimonials = [
    {
      name:    'María González',
      role:    'Desarrolladora Frontend',
      company: 'Google',
      avatar:  'MG',
      color:   '#4F46E5',
      stars:   5,
      text:    'Academix transformó mi carrera. En 6 meses pasé de no saber nada de programación a conseguir mi primer trabajo como desarrolladora en una empresa top.',
    },
    {
      name:    'Carlos Mendoza',
      role:    'Data Scientist',
      company: 'Netflix',
      avatar:  'CM',
      color:   '#06B6D4',
      stars:   5,
      text:    'Los cursos de Data Science son increíblemente completos. Los instructores son expertos reales de la industria, no solo teóricos.',
    },
    {
      name:    'Ana Rodríguez',
      role:    'UX Designer',
      company: 'Spotify',
      avatar:  'AR',
      color:   '#2D2D7B',
      stars:   5,
      text:    'La calidad del contenido es excepcional. Cada curso está diseñado pensando en el aprendizaje real y aplicable al mundo laboral.',
    },
  ];

  faqs = [
    {
      question: '¿Puedo cancelar mi suscripción en cualquier momento?',
      answer:   'Sí, puedes cancelar tu suscripción cuando quieras sin penalizaciones. Seguirás teniendo acceso hasta el final del período pagado.',
      open:     false,
    },
    {
      question: '¿Los certificados tienen validez oficial?',
      answer:   'Nuestros certificados son reconocidos por más de 500 empresas a nivel mundial. Incluyen un código QR de verificación y están respaldados por nuestra institución.',
      open:     false,
    },
    {
      question: '¿Puedo acceder a los cursos desde mi celular?',
      answer:   'Sí, Academix está disponible en iOS y Android. Con el plan Pro también puedes descargar los cursos para verlos sin conexión.',
      open:     false,
    },
    {
      question: '¿Qué pasa si no me gusta un curso?',
      answer:   'Si un curso no es de tu agrado, puedes solicitar un reembolso dentro de los primeros 3 días de inicio. ',
      open:     false,
    },
  ];
  
  scrollTo(sectionId: string): void {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}