'use client';

import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MermaidProps {
  chart: string;
  title?: string;
}

// Расширяем Window для хранения темы Mermaid
declare global {
  interface Window {
    __mermaidTheme?: 'light' | 'dark';
  }
}

// Инициализируем mermaid один раз
let mermaidInitialized = false;

export function Mermaid({ chart, title }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeKey, setThemeKey] = useState(0);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const renderDiagram = async () => {
      try {
        // Динамический импорт mermaid (только на клиенте)
        const mermaid = (await import('mermaid')).default;

        // Определяем текущую тему (светлая/тёмная)
        const isDark = document.documentElement.classList.contains('dark');

        // Цвета для светлой и темной темы (из globals.css)
        const colors = isDark
          ? {
              // Темная тема (OKLCH конвертированные в RGB)
              textPrimary: '#f2f2f3', // oklch(95% 0.005 240)
              textSecondary: '#bdbec1', // oklch(75% 0.01 240)
              textTertiary: '#9a9b9e', // oklch(62.84% 0.01 240)
              bgPrimary: '#2a2a2e', // oklch(22.7% 0.0063 240)
              bgSecondary: '#2a2a2e', // oklch(22.7% 0.0063 240)
              bgTertiary: '#3d3d42', // oklch(27.77% 0.0068 240)
              bgBorder: '#4d4d53', // oklch(34% 0.0077 240)
              primaryColor: '#5d7a9d', // Мягкий серо-синий для темной темы
              primaryBorder: '#4a6582', // Более темный серо-синий для границ
              warningBg: '#3d3420', // Темный фон для предупреждений без прозрачности
              warningBorder: '#5a4d2e', // Темная граница для предупреждений
              warningText: '#f8c44b', // oklch(81.1% 0.154 70.7)
              dangerBg: '#3d2020', // Темный красный фон
              dangerBorder: '#5a2e2e', // Темная красная граница
              dangerText: '#f86b6b', // Светлый красный текст
            }
          : {
              // Светлая тема (OKLCH конвертированные в RGB)
              textPrimary: '#1f2024', // oklch(17.5% 0.006 240)
              textSecondary: '#5f6066', // oklch(42.6% 0.01 240)
              textTertiary: '#84858a', // oklch(56.1% 0.01 240)
              bgPrimary: '#ffffff', // белый
              bgSecondary: '#f7f8fa', // oklch(97.5% 0.003 240)
              bgTertiary: '#f7f8fa', // oklch(97.5% 0.003 240)
              bgBorder: '#dfe1e6', // oklch(90% 0.005 240)
              primaryColor: '#e8eef5', // Очень светлый серо-синий для фона блоков
              primaryBorder: '#a8b9ce', // Мягкий серо-синий для границ
              warningBg: '#fef8e8', // oklch(98% 0.02 85)
              warningBorder: '#f5d88d', // oklch(92% 0.04 85)
              warningText: '#9d6b0d', // oklch(55% 0.14 85)
              dangerBg: '#fef2f2', // Светлый красный фон
              dangerBorder: '#fca5a5', // Красная граница
              dangerText: '#b91c1c', // Темный красный текст
            };

        // Сбрасываем флаг инициализации при смене темы
        const currentTheme = isDark ? 'dark' : 'light';
        if (mermaidInitialized && window.__mermaidTheme !== currentTheme) {
          mermaidInitialized = false;
        }

        // Инициализируем mermaid
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
              // Используем цвета из дизайн-системы
              primaryColor: colors.primaryColor,
              primaryTextColor: colors.textPrimary,
              primaryBorderColor: colors.primaryBorder,
              lineColor: colors.textTertiary,
              secondaryColor: colors.bgTertiary,
              tertiaryColor: colors.bgSecondary,
              background: colors.bgPrimary,
              mainBkg: colors.bgSecondary,
              secondBkg: colors.bgTertiary,
              border1: colors.bgBorder,
              border2: colors.textTertiary,
              // Цвета для стрелок
              arrowheadColor: colors.textTertiary,
              edgeLabelBackground: colors.bgPrimary,
              // Note блоки - используем цвета warning callout
              note: colors.warningText,
              noteBkgColor: colors.warningBg,
              noteTextColor: colors.warningText,
              noteBorderColor: colors.warningBorder,
              // Скругления
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily:
                'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
            },
            flowchart: {
              htmlLabels: true,
              curve: 'basis',
              padding: 20,
            },
            sequence: {
              diagramMarginX: 20,
              diagramMarginY: 20,
              actorMargin: 80,
              width: 180,
              height: 60,
              boxMargin: 10,
              boxTextMargin: 5,
              noteMargin: 10,
              messageMargin: 40,
              mirrorActors: true,
              bottomMarginAdj: 1,
              useMaxWidth: true,
              rightAngles: false,
            },
          });
          mermaidInitialized = true;
          window.__mermaidTheme = currentTheme;
        }

        // Генерируем уникальный ID для диаграммы
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Рендерим диаграмму
        const { svg } = await mermaid.render(id, chart);

        // Вставляем SVG в контейнер
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // Применяем скругления и цвета к элементам диаграммы
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // Скругляем все rect элементы (блоки в диаграмме)
            const rects = svgElement.querySelectorAll('rect');
            rects.forEach((rect) => {
              rect.setAttribute('rx', '8');
              rect.setAttribute('ry', '8');
            });

            // Применяем мягкий цвет ко всем path элементам (стрелки и линии)
            const allPaths = svgElement.querySelectorAll('path');
            allPaths.forEach((path) => {
              const element = path as SVGPathElement;
              // Пропускаем path внутри clipPath
              if (!path.closest('clipPath')) {
                element.style.stroke = colors.textTertiary;
                element.setAttribute('stroke', colors.textTertiary);
                element.style.strokeWidth = '1';
                element.setAttribute('stroke-width', '1');

                // Убираем прерывистость (делаем границы блоков сплошными)
                element.removeAttribute('stroke-dasharray');
                element.style.strokeDasharray = 'none';
              }
            });

            // Применяем цвет к линиям и делаем вертикальные прерывистыми
            const lines = svgElement.querySelectorAll('line');
            lines.forEach((line) => {
              const element = line as SVGLineElement;
              const x1 = parseFloat(element.getAttribute('x1') || '0');
              const x2 = parseFloat(element.getAttribute('x2') || '0');

              // Применяем цвет и толщину
              element.style.stroke = colors.textTertiary;
              element.setAttribute('stroke', colors.textTertiary);
              element.style.strokeWidth = '1';
              element.setAttribute('stroke-width', '1');

              // Вертикальные линии (lifelines) делаем прерывистыми
              const isVertical = Math.abs(x1 - x2) < 1;
              if (isVertical) {
                // Убираем старый dasharray и устанавливаем новый
                element.removeAttribute('stroke-dasharray');
                element.style.strokeDasharray = '';
                element.style.strokeDasharray = '8 4';
                element.setAttribute('stroke-dasharray', '8 4');
              }
            });

            // Применяем цвет к маркерам стрелок (наконечники)
            const markerPaths = svgElement.querySelectorAll('marker path, marker polygon');
            markerPaths.forEach((marker) => {
              const element = marker as SVGElement;
              element.style.fill = colors.textTertiary;
              element.style.stroke = colors.textTertiary;
              element.setAttribute('fill', colors.textTertiary);
              element.setAttribute('stroke', colors.textTertiary);
            });

            // Применяем цвет к polyline элементам и убираем прерывистость
            const polylines = svgElement.querySelectorAll('polyline');
            polylines.forEach((polyline) => {
              const element = polyline as SVGPolylineElement;
              element.style.stroke = colors.textTertiary;
              element.setAttribute('stroke', colors.textTertiary);
              element.style.strokeWidth = '1';
              element.setAttribute('stroke-width', '1');

              // Убираем прерывистость (делаем границы блоков сплошными)
              element.removeAttribute('stroke-dasharray');
              element.style.strokeDasharray = 'none';
            });

            // Убираем прерывистость у линий с классом loopLine (границы блоков alt/opt/loop)
            const loopLines = svgElement.querySelectorAll('.loopLine');
            loopLines.forEach((loopLine) => {
              const element = loopLine as SVGLineElement;
              element.style.strokeDasharray = 'none';
              element.setAttribute('stroke-dasharray', 'none');
            });

            // Применяем красный цвет к заметкам с временными ограничениями (3 секунды)
            const allTextElements = svgElement.querySelectorAll('text');
            allTextElements.forEach((textElement) => {
              const textContent = textElement.textContent || '';

              // Обрабатываем заметки с "секунд" (красный цвет)
              if (textContent.includes('секунд')) {
                // Находим родительскую группу
                let noteGroup = textElement.parentElement;
                // Поднимаемся вверх, пока не найдем группу с rect
                while (noteGroup && noteGroup.tagName === 'g') {
                  const rect = noteGroup.querySelector(':scope > rect');
                  if (rect) {
                    // Нашли группу с rect - это наша заметка
                    const rectElement = rect as SVGRectElement;
                    rectElement.setAttribute('fill', colors.dangerBg);
                    rectElement.setAttribute('stroke', colors.dangerBorder);
                    rectElement.style.fill = colors.dangerBg;
                    rectElement.style.stroke = colors.dangerBorder;

                    // Применяем красный цвет ко всем текстовым элементам в этой группе
                    const textElements = noteGroup.querySelectorAll('text, tspan');
                    textElements.forEach((text) => {
                      const textEl = text as SVGElement;
                      textEl.setAttribute('fill', colors.dangerText);
                      textEl.style.fill = colors.dangerText;
                    });
                    break;
                  }
                  noteGroup = noteGroup.parentElement;
                }
              }
            });

            // Применяем обводку ко всем текстам в блоках alt/opt/loop
            // Ищем все text элементы, которые содержат текст в квадратных скобках
            const loopTexts = svgElement.querySelectorAll('text');
            loopTexts.forEach((textElement) => {
              const textContent = textElement.textContent || '';
              // Проверяем, содержит ли текст квадратные скобки
              if (textContent.includes('[') || textContent.includes(']')) {
                // В светлой теме используем белую обводку, в темной - темную
                const strokeColor = isDark ? '#1a1a1c' : colors.bgPrimary;

                const textEl = textElement as SVGTextElement;
                textEl.style.setProperty('paint-order', 'stroke fill', 'important');
                textEl.style.setProperty('stroke', strokeColor, 'important');
                textEl.style.setProperty('stroke-width', '8px', 'important');
                textEl.style.setProperty('stroke-linecap', 'round', 'important');
                textEl.style.setProperty('stroke-linejoin', 'round', 'important');

                // Применяем те же стили ко всем вложенным tspan элементам
                const tspans = textElement.querySelectorAll('tspan');
                tspans.forEach((tspan) => {
                  const tspanEl = tspan as SVGTSpanElement;
                  tspanEl.style.setProperty('paint-order', 'stroke fill', 'important');
                  tspanEl.style.setProperty('stroke', strokeColor, 'important');
                  tspanEl.style.setProperty('stroke-width', '8px', 'important');
                  tspanEl.style.setProperty('stroke-linecap', 'round', 'important');
                  tspanEl.style.setProperty('stroke-linejoin', 'round', 'important');
                });
              }
            });
          }
        }

        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setIsLoading(false);
      }
    };

    renderDiagram();

    // Слушаем изменения темы (класс 'dark' на documentElement)
    const observer = new MutationObserver(() => {
      setThemeKey((prev) => prev + 1);
      setIsLoading(true);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [chart, themeKey]);

  // Добавляем обработчик wheel с { passive: false } для предотвращения зума страницы
  useEffect(() => {
    const wrapper = svgWrapperRef.current;
    if (!wrapper) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (!e.ctrlKey) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? 0.98 : 1.02;
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.1, Math.min(5, prev.scale * delta)),
      }));
    };

    wrapper.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => wrapper.removeEventListener('wheel', handleWheelNative);
  }, []);

  // Функции управления масштабом и положением
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.5, 5),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.5, 0.1),
    }));
  };

  const handleReset = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  // Обработчики для перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Только левая кнопка мыши
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          <strong>Ошибка отображения диаграммы:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div className="not-prose my-6">
      {title && (
        <div className="mb-3 text-sm font-medium text-text-primary">
          <span className="inline-flex items-center gap-1.5">{title}</span>
        </div>
      )}
      <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-background-border bg-background p-6 min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Загрузка диаграммы...
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        {!isLoading && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md bg-background-secondary border border-background-border hover:bg-background-tertiary transition-colors"
              title="Увеличить"
              type="button"
            >
              <ZoomIn className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md bg-background-secondary border border-background-border hover:bg-background-tertiary transition-colors"
              title="Уменьшить"
              type="button"
            >
              <ZoomOut className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-md bg-background-secondary border border-background-border hover:bg-background-tertiary transition-colors"
              title="Сбросить"
              type="button"
            >
              <RotateCcw className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        )}

        <div
          ref={svgWrapperRef}
          className="w-full h-full select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
