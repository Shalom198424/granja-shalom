import { useState } from 'react'
import CheckoutStepper from '../components/CheckoutStepper'
import PrimaryButton from '../components/PrimaryButton'
import type { PaymentMethod } from '../types'
import { formatCurrency as ars } from '../utils/currency'

export default function PaymentScreen({
  payment,
  setPayment,
  total,
  receipt,
  setReceipt,
  onPay,
  isSubmitting = false,
}: {
  payment: PaymentMethod
  setPayment: (p: PaymentMethod) => void
  total: number
  receipt: string | null
  setReceipt: (r: string | null) => void
  onPay: () => void
  isSubmitting?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [dragging, setDragging] = useState(false)

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText('granja.shalom.bb')
    } catch {
      /* clipboard puede no estar disponible en el preview */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const takeFile = (file?: File) => {
    if (!file) return
    setReceipt(file.name)
  }

  return (
    <div className="animate-rise space-y-5 px-4 py-5 pb-40 md:px-6 lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 lg:space-y-0 lg:px-8 lg:py-10 lg:pb-10">
      <div className="space-y-5">
      <CheckoutStepper current={2} />

      <div className="rounded-2xl bg-shalom-forest p-4 text-white">
        <span className="text-sm text-white/70">Total a pagar</span>
        <div className="font-display text-3xl font-extrabold">{ars(total)}</div>
      </div>

      <h2 className="font-display text-lg font-bold text-shalom-forest">
        ¿Cómo querés pagar?
      </h2>

      <button
        onClick={() => setPayment('mp')}
        className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
          payment === 'mp'
            ? 'border-shalom-leaf bg-white shadow-md'
            : 'border-transparent bg-white/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009ee3] text-lg">
            💳
          </span>
          <div>
            <div className="font-display font-bold text-shalom-forest">
              Mercado Pago
            </div>
            <div className="text-sm text-shalom-ink/60">
              Tarjeta, dinero en cuenta o QR
            </div>
          </div>
        </div>
      </button>

      <button
        onClick={() => setPayment('transfer')}
        className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
          payment === 'transfer'
            ? 'border-shalom-leaf bg-white shadow-md'
            : 'border-transparent bg-white/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-shalom-mist text-lg">
            🏦
          </span>
          <div>
            <div className="font-display font-bold text-shalom-forest">
              Transferencia bancaria
            </div>
            <div className="text-sm text-shalom-ink/60">
              Con alias y comprobante
            </div>
          </div>
        </div>
      </button>

      <button
        onClick={() => setPayment('cash')}
        className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
          payment === 'cash'
            ? 'border-shalom-leaf bg-white shadow-md'
            : 'border-transparent bg-white/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-shalom-mist text-lg">
            💵
          </span>
          <div>
            <div className="font-display font-bold text-shalom-forest">
              Efectivo
            </div>
            <div className="text-sm text-shalom-ink/60">
              Pagás al retirar o recibir tu caja
            </div>
          </div>
        </div>
      </button>

      {payment === 'transfer' && (
        <div className="animate-rise space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-shalom-ink/50">
              Alias
            </span>
            <button
              onClick={copyAlias}
              className="mt-1 flex w-full items-center justify-between rounded-xl bg-shalom-mist px-3 py-2.5 transition-colors hover:bg-shalom-lime/40"
            >
              <span className="font-display font-bold text-shalom-forest">
                granja.shalom.bb
              </span>
              <span className="text-xs font-semibold text-shalom-leaf">
                {copied ? '✓ Copiado' : 'Copiar'}
              </span>
            </button>
          </div>
          <p className="text-xs text-shalom-ink/60">
            Titular: Cooperativa Granja Shalom · CBU 000000000000000000000
          </p>
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              takeFile(e.dataTransfer.files?.[0])
            }}
            className={`block cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragging
                ? 'border-shalom-leaf bg-shalom-lime/20'
                : receipt
                  ? 'border-shalom-leaf/60 bg-shalom-mist/60'
                  : 'border-shalom-leaf/40 bg-shalom-mist/50 hover:bg-shalom-mist'
            }`}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => takeFile(e.target.files?.[0])}
            />
            <div className="text-2xl">{receipt ? '✅' : '📎'}</div>
            <div className="mt-1 text-sm font-semibold text-shalom-forest">
              {receipt ? receipt : 'Arrastrá tu comprobante acá'}
            </div>
            <div className="text-xs text-shalom-ink/50">
              {receipt
                ? 'Tocá para cambiar el archivo'
                : 'o tocá para elegir · JPG, PNG o PDF (hasta 5 MB)'}
            </div>
          </label>
          <p className="rounded-xl bg-shalom-clay-soft/60 px-3 py-2.5 text-xs leading-relaxed text-shalom-clay">
            ⓘ Verificaremos tu comprobante en las próximas horas.
          </p>
        </div>
      )}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-shalom-cream/95 p-4 backdrop-blur-md lg:static lg:rounded-3xl lg:border-0 lg:bg-white lg:p-6 lg:shadow-sm lg:ring-1 lg:ring-black/5 lg:backdrop-blur-none">
        <div className="mb-4 hidden lg:block">
          <span className="text-sm text-shalom-ink/60">Total a pagar</span>
          <div className="font-display text-3xl font-extrabold text-shalom-forest">{ars(total)}</div>
        </div>
        <PrimaryButton
          onClick={onPay}
          disabled={(payment === 'transfer' && !receipt) || isSubmitting}
        >
          {isSubmitting
            ? 'Procesando...'
            : payment === 'mp'
              ? 'Pagar con Mercado Pago'
              : payment === 'transfer'
                ? receipt
                  ? 'Confirmar pedido'
                  : 'Subí tu comprobante para continuar'
                : 'Confirmar pedido'}
        </PrimaryButton>
      </div>
    </div>
  )
}
