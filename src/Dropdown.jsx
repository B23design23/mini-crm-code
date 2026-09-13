import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

function Dropdown({ id, value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = options[selectedIndex]

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }

  function openMenu() {
    updatePosition()
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e) {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      closeMenu()
    }
    function handleScrollOrResize() {
      closeMenu()
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open])

  function handleKeyDown(e) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const opt = options[activeIndex]
      if (opt) {
        onChange(opt.value)
        closeMenu()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
    } else if (e.key === 'Tab') {
      closeMenu()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown size={16} className="shrink-0 text-text-secondary" />
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className="z-50 max-h-64 overflow-auto rounded-xl border border-border bg-surface py-1 text-sm shadow-soft"
          >
            {options.map((opt, index) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(opt.value)
                  closeMenu()
                  buttonRef.current?.focus()
                }}
                className={
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 ' +
                  (index === activeIndex ? 'bg-page ' : '') +
                  (opt.value === value ? 'font-medium text-accent' : 'text-text-primary')
                }
              >
                {opt.label}
                {opt.value === value && <Check size={16} className="shrink-0 text-accent" />}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  )
}

export default Dropdown
