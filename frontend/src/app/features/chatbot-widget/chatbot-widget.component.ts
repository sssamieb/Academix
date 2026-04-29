import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss'],
})
export class ChatbotWidgetComponent implements OnInit {
  @Input() context: 'landing' | 'student' | 'instructor' | 'admin' = 'landing';

  isOpen    = false;
  isTyping  = false;
  userInput = '';
  history: ChatMessage[] = [];

  welcomeMessages: Record<string, string> = {
    landing:    '¡Hola! 👋 Soy el asistente de Academix. ¿Te puedo ayudar a encontrar el plan perfecto para vos?',
    student:    '¡Hola! 👋 Soy tu asistente de aprendizaje. ¿En qué te puedo ayudar hoy?',
    instructor: '¡Hola! 👋 Soy tu asistente de Academix. ¿Necesitás ayuda con tus cursos o material?',
    admin:      '¡Hola! 👋 Soy tu asistente administrativo. ¿Qué información necesitás?',
  };

  contextLabels: Record<string, string> = {
    landing:    'Asistente Academix',
    student:    'Asistente de aprendizaje',
    instructor: 'Asistente de instructor',
    admin:      'Asistente administrativo',
  };

  constructor(
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.history = [{
      role: 'model',
      text: this.welcomeMessages[this.context]
    }];
  }

  get label() { return this.contextLabels[this.context]; }

  toggleChat(): void { this.isOpen = !this.isOpen; }

  sendMessage(): void {
    const msg = this.userInput.trim();
    if (!msg || this.isTyping) return;

    this.history.push({ role: 'user', text: msg });
    this.userInput = '';
    this.isTyping  = true;

    const historyToSend = this.history.slice(1, this.history.length - 1);

    this.chatbotService.sendMessage(msg, this.context, historyToSend).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.history.push({ role: 'model', text: res.reply });
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.isTyping = false;
        this.history.push({
          role: 'model',
          text: 'Tuve un problema para responder. Por favor intentá de nuevo.'
        });
        this.cdr.detectChanges();
      }
    });

    this.scrollToBottom();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
  }
  formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  }
}