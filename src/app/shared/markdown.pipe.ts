import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Converte um Markdown simples (o que a IA costuma devolver) em HTML seguro.
 *
 * Suporta: **negrito**, *itálico*, `código`, títulos (#..######) e listas (- / *).
 * As quebras de linha são preservadas pelo CSS (white-space: pre-wrap) de quem usa.
 *
 * Segurança: o texto é 100% escapado ANTES de injetar qualquer tag, então só as
 * tags que nós mesmos geramos chegam ao DOM — sem risco de HTML/script vindo do LLM.
 */
@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(render(value ?? ''));
  }
}

function render(texto: string): string {
  let s = escapeHtml(texto);

  // Títulos: "# Título" -> negrito (vira uma linha em destaque)
  s = s.replace(/^#{1,6}\s+(.*)$/gm, '<strong>$1</strong>');

  // Itens de lista: "- item" / "* item" -> "• item"
  s = s.replace(/^\s*[-*]\s+/gm, '• ');

  // Código inline: `código`
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Negrito: **texto** ou __texto__ (antes do itálico)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Itálico: *texto* ou _texto_
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  return s;
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
