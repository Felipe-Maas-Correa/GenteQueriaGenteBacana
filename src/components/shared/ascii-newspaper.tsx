"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

/**
 * Página de jornal desenhada com caracteres (ASCII art animada).
 *
 * A cada quadro, uma página de jornal (a mesma do logotipo: cabeçalho, foto e
 * colunas de texto) é desenhada numa tela invisível, girando devagar em
 * torno do eixo vertical. Essa imagem é lida em blocos e cada bloco vira um
 * caractere conforme o brilho (" .:-=+*#%@"). Uma onda de brilho percorre a
 * página e os caracteres reagem ao mouse. Quem prefere menos movimento vê
 * um quadro parado.
 */
const RAMP = " .:-=+*#%@"
const CELL = 11 // tamanho de cada caractere, em px CSS
const PAGE = "rgb(255,255,255)"
const BLUE = "rgb(80,140,255)"

function drawNewspaper(ctx: CanvasRenderingContext2D, w: number, h: number, angle: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  // Balanço em torno do eixo vertical (perspectiva simples): a página vira
  // de um lado para o outro, sem nunca ficar de perfil, e inclina de leve.
  const turn = Math.cos(Math.sin(angle) * 0.9)
  ctx.scale(turn, 1)
  ctx.rotate(Math.sin(angle * 0.7) * 0.06)

  const pw = Math.min(w * 0.72, (h * 0.78) / 1.25)
  const ph = pw * 1.25
  const x = -pw / 2
  const y = -ph / 2

  // Folha de trás (jornal dobrado)
  ctx.globalAlpha = 0.45
  ctx.lineWidth = pw * 0.035
  ctx.strokeStyle = PAGE
  ctx.strokeRect(x + pw * 0.14, y - pw * 0.12, pw, ph)
  ctx.globalAlpha = 1

  // Página da frente (papel em cinza médio vira uma textura de pontos)
  ctx.fillStyle = "rgb(58,58,58)"
  ctx.fillRect(x, y, pw, ph)
  ctx.lineWidth = pw * 0.05
  ctx.strokeRect(x, y, pw, ph)

  {
    ctx.fillStyle = PAGE
    const pad = pw * 0.14
    // Cabeçalho
    ctx.fillRect(x + pad, y + pad, pw - pad * 2, ph * 0.1)
    // Foto: a "gente" do jornal, em azul
    ctx.fillStyle = BLUE
    ctx.beginPath()
    ctx.arc(x + pad + pw * 0.17, y + ph * 0.5, pw * 0.17, 0, Math.PI * 2)
    ctx.fill()
    // Colunas de texto
    ctx.fillStyle = PAGE
    const colX = x + pw * 0.56
    const colW = pw * 0.3
    for (let i = 0; i < 4; i++) ctx.fillRect(colX, y + ph * (0.36 + i * 0.075), colW, ph * 0.035)
    for (let i = 0; i < 2; i++) ctx.fillRect(x + pad, y + ph * (0.74 + i * 0.075), pw - pad * 2, ph * 0.035)
  }
  ctx.restore()
}

export function AsciiNewspaper({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const source = document.createElement("canvas")
    const sctx = source.getContext("2d", { willReadFrequently: true })
    if (!sctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let cols = 0
    let rows = 0
    let dpr = 1
    let frame = 0
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      cols = Math.floor(rect.width / CELL)
      rows = Math.floor(rect.height / CELL)
      // A imagem de origem tem 1 pixel por caractere.
      source.width = cols
      source.height = rows
    }

    const render = (time: number) => {
      const t = time / 1000
      const angle = reduced ? 0.6 : t * 0.45
      drawNewspaper(sctx, cols, rows, angle)
      const pixels = sctx.getImageData(0, 0, cols, rows).data

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${CELL}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
      ctx.textBaseline = "top"

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 4
          const alpha = pixels[i + 3] / 255
          if (alpha < 0.05) continue
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          let light = ((r + g + b) / 765) * alpha

          // Onda de brilho atravessando a página.
          if (!reduced) light += Math.sin(col * 0.18 + row * 0.08 - t * 2.4) * 0.08

          // Reação ao mouse: os caracteres "acendem" perto do cursor.
          const px = col * CELL
          const py = row * CELL
          const dist = Math.hypot(px - mouse.x, py - mouse.y)
          if (dist < 90) light += (1 - dist / 90) * 0.45

          // Fundo escuro da página vira pontinhos discretos.
          if (light < 0.08) light = 0.08
          const index = Math.min(RAMP.length - 1, Math.max(1, Math.round(light * (RAMP.length - 1))))
          const isBlue = b > r + 40
          ctx.fillStyle = isBlue
            ? `rgba(110,160,255,${0.35 + light * 0.65})`
            : `rgba(235,235,235,${0.12 + light * 0.75})`
          ctx.fillText(RAMP[index], px, py)
        }
      }
      if (!reduced) frame = requestAnimationFrame(render)
    }

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = event.clientX - rect.left
      mouse.y = event.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      if (reduced) render(0)
    })
    observer.observe(canvas)
    window.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerleave", onLeave)
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className={cn("block size-full", className)} />
}
