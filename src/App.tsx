import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from './components/Header'
import WhatsAppFab from './components/WhatsApp'
import { DELIVERY_ZONES } from './data/deliveryZones'
import { BOXES } from './data/products'
import CartScreen from './pages/CartPage'
import CatalogScreen from './pages/CatalogPage'
import CheckoutScreen from './pages/CheckoutPage'
import ConfirmationScreen from './pages/ConfirmationPage'
import HomeScreen from './pages/HomePage'
import PaymentScreen from './pages/PaymentPage'
import DetailScreen from './pages/ProductDetailPage'
import type { CartLine, ConfirmedOrder, Customer, Fulfillment, PaymentMethod } from './types'
import { backPath, screenFromPath, screenTitle } from './utils/navigation'
import { supabase } from './lib/supabase'
import { createOrder } from './lib/orders'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const screen = screenFromPath(location.pathname)
  const [cart, setCart] = useState<CartLine[]>([])
  const [detailQty, setDetailQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '' })
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [zone, setZone] = useState(DELIVERY_ZONES[0].id)
  const [payment, setPayment] = useState<PaymentMethod>('mp')
  const [receipt, setReceipt] = useState<string | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null)
  const [orderId] = useState(() => 'GS-' + Math.floor(1000 + Math.random() * 9000))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const cartCount = cart.reduce((count, line) => count + line.qty, 0)
  const lines = useMemo(
    () => cart
      .map((line) => ({ box: BOXES.find((box) => box.id === line.boxId)!, qty: line.qty }))
      .filter((line) => line.box),
    [cart],
  )
  const subtotal = lines.reduce((sum, line) => sum + line.box.price * line.qty, 0)
  const shipping = fulfillment === 'delivery'
    ? DELIVERY_ZONES.find((deliveryZone) => deliveryZone.id === zone)?.cost ?? 0
    : 0
  const total = subtotal + shipping

  useEffect(() => {
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo(0, 0)
      window.scrollTo(0, 0)
    })
  }, [location.pathname])

  useEffect(() => {
    console.log('Supabase client successfully initialized:', supabase)
  }, [])

  const goDetail = (id: string) => {
    setDetailQty(1)
    navigate(`/productos/${id}`)
  }

  const addToCart = (id: string, qty: number) => {
    setCart((previous) => {
      const found = previous.find((line) => line.boxId === id)
      if (found) {
        return previous.map((line) =>
          line.boxId === id ? { ...line, qty: line.qty + qty } : line,
        )
      }
      return [...previous, { boxId: id, qty }]
    })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  const setQty = (id: string, qty: number) =>
    setCart((previous) => qty <= 0
      ? previous.filter((line) => line.boxId !== id)
      : previous.map((line) => line.boxId === id ? { ...line, qty } : line),
    )

  const confirmOrder = async () => {
    setIsSubmitting(true)
    try {
      await createOrder(orderId, customer, fulfillment, zone, payment, subtotal, shipping, total, lines)
      
      if (payment === 'mp') {
        const { data, error } = await supabase.functions.invoke('create-preference', {
          body: {
            orderId,
            items: lines.map((line) => ({
              boxId: line.box.id,
              boxName: line.box.name,
              qty: line.qty,
              price: line.box.price,
            })),
            shipping,
            customerName: customer.name,
            customerEmail: customer.email,
            origin: window.location.origin,
          },
        })

        if (error) {
          console.error('Error from Edge Function:', error)
          throw new Error(`Edge Function falló: ${error.message || JSON.stringify(error)}`)
        }

        if (!data?.init_point) {
          console.error('Data returned:', data)
          throw new Error(`No se devolvió init_point. Respuesta: ${JSON.stringify(data)}`)
        }

        setCart([])
        window.location.href = data.init_point
        return
      }

      setConfirmedOrder({ lines, total })
      setCart([])
      navigate(`/pedido/${orderId}`)
    } catch (error: any) {
      console.error(error)
      alert(`Hubo un error al guardar el pedido: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen w-full bg-shalom-cream lg:bg-[#d9e4cf] lg:p-6">
      <div className="relative mx-auto flex h-screen w-full flex-col overflow-hidden bg-shalom-cream lg:h-auto lg:min-h-[calc(100vh-3rem)] lg:max-w-[1440px] lg:overflow-visible lg:rounded-[2rem] lg:shadow-2xl lg:ring-1 lg:ring-black/5">
        <Header
          title={screenTitle(screen)}
          onBack={screen === 'home' ? undefined : () => navigate(backPath(screen))}
          cartCount={cartCount}
          screen={screen}
          onHome={() => navigate('/')}
          onCatalog={() => navigate('/productos')}
          onCart={() => navigate('/carrito')}
        />

        <div ref={scrollRef} className="scroll-area relative flex-1 overflow-y-auto overscroll-contain lg:overflow-visible">
          <Routes>
            <Route path="/" element={<HomeScreen onShop={() => navigate('/productos')} onOpen={goDetail} />} />
            <Route path="/productos" element={<CatalogScreen onOpen={goDetail} onShop={() => navigate('/productos')} />} />
            <Route
              path="/productos/:id"
              element={
                <ProductRoute
                  qty={detailQty}
                  setQty={setDetailQty}
                  onAdd={(id) => {
                    addToCart(id, detailQty)
                    navigate('/carrito')
                  }}
                />
              }
            />
            <Route
              path="/carrito"
              element={
                <CartScreen
                  lines={lines}
                  subtotal={subtotal}
                  setQty={setQty}
                  onShop={() => navigate('/productos')}
                  onContinue={() => navigate('/checkout')}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                <CheckoutScreen
                  customer={customer}
                  setCustomer={setCustomer}
                  fulfillment={fulfillment}
                  setFulfillment={setFulfillment}
                  zone={zone}
                  setZone={setZone}
                  subtotal={subtotal}
                  shipping={shipping}
                  total={total}
                  onContinue={() => navigate('/checkout/pago')}
                />
              }
            />
            <Route
              path="/checkout/pago"
              element={
                <PaymentScreen
                  payment={payment}
                  setPayment={setPayment}
                  total={total}
                  receipt={receipt}
                  setReceipt={setReceipt}
                  onPay={confirmOrder}
                  isSubmitting={isSubmitting}
                />
              }
            />
            <Route
              path="/pedido/:id"
              element={
                <OrderRoute
                  orderId={orderId}
                  order={confirmedOrder}
                  payment={payment}
                  fulfillment={fulfillment}
                  zone={zone}
                  customer={customer}
                  onHome={() => navigate('/')}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {justAdded && (
          <div className="animate-pop pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-shalom-forest px-5 py-2.5 text-sm font-semibold text-white shadow-xl lg:fixed">
            ✓ Agregado al carrito
          </div>
        )}

        <WhatsAppFab
          bottom={screen === 'cart' && cartCount > 0
            ? 232
            : screen === 'detail' || screen === 'checkout' || screen === 'payment'
              ? 104
              : 24}
        />
      </div>
    </div>
  )
}

function ProductRoute({ qty, setQty, onAdd }: {
  qty: number
  setQty: (qty: number) => void
  onAdd: (id: string) => void
}) {
  const { id } = useParams()
  const box = BOXES.find((product) => product.id === id)

  if (!box) return <Navigate to="/productos" replace />

  return <DetailScreen box={box} qty={qty} setQty={setQty} onAdd={() => onAdd(box.id)} />
}

function OrderRoute({ orderId, order, payment, fulfillment, zone, customer, onHome }: {
  orderId: string
  order: ConfirmedOrder | null
  payment: PaymentMethod
  fulfillment: Fulfillment
  zone: string
  customer: Customer
  onHome: () => void
}) {
  const { id } = useParams()

  if (!order || id !== orderId) return <Navigate to="/" replace />

  return (
    <ConfirmationScreen
      orderId={id}
      lines={order.lines}
      total={order.total}
      payment={payment}
      fulfillment={fulfillment}
      zone={zone}
      customer={customer}
      onHome={onHome}
    />
  )
}
