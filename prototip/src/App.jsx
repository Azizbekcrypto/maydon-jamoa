import { useState } from 'react'
import { oyinlar as namuna } from './namuna.js'
import './App.css'

// Uch ekran: O'yinlar · O'yin · E'lon berish (wireframe.jpg dagidek).
// Ma'lumot namuna.js dan; o'zgarishlar faqat shu ochiq sahifada turadi.
export default function App() {
  const [oyinlar, setOyinlar] = useState(namuna)
  // Qaysi ekran ochiq: { nom: 'oyinlar' } · { nom: 'oyin', id } · { nom: 'elon' }
  const [ekran, setEkran] = useState({ nom: 'oyinlar' })
  // Shu sahifada «Qo'shilaman» bosilgan o'yinlar
  const [qoshildim, setQoshildim] = useState([])

  function qoshil(id) {
    setOyinlar((r) => r.map((o) => (o.id === id ? { ...o, qoshilgan: o.qoshilgan + 1 } : o)))
    setQoshildim((r) => [...r, id])
  }

  function elonBer(yangi) {
    setOyinlar((r) => [...r, { ...yangi, id: String(r.length + 1), qoshilgan: 0 }])
    setEkran({ nom: 'oyinlar' })
  }

  const oyin = ekran.nom === 'oyin' ? oyinlar.find((o) => o.id === ekran.id) : null

  return (
    <div className="ilova">
      <header className="ilova-nomi">Maydon Jamoa</header>
      {ekran.nom === 'oyinlar' && (
        <Oyinlar oyinlar={oyinlar} onOch={(id) => setEkran({ nom: 'oyin', id })} onElon={() => setEkran({ nom: 'elon' })} />
      )}
      {oyin && (
        <Oyin
          oyin={oyin}
          qoshilgan={qoshildim.includes(oyin.id)}
          onQoshil={() => qoshil(oyin.id)}
          onOrqaga={() => setEkran({ nom: 'oyinlar' })}
        />
      )}
      {ekran.nom === 'elon' && <Elon onYubor={elonBer} onOrqaga={() => setEkran({ nom: 'oyinlar' })} />}
    </div>
  )
}

function Oyinlar({ oyinlar, onOch, onElon }) {
  return (
    <main className="ekran">
      <h1>O'yinlar</h1>
      <div className="oyinlar">
        {oyinlar.map((o) => (
          <button key={o.id} className="karta" onClick={() => onOch(o.id)}>
            <span className="karta-vaqt">
              {o.kun}, {o.soat}
            </span>
            <span className="karta-maydon">{o.maydon}</span>
            <span className="karta-hisob">
              {o.qoshilgan} / {o.kerak}
            </span>
          </button>
        ))}
      </div>
      <button className="tugma asosiy" onClick={onElon}>
        E'lon berish
      </button>
    </main>
  )
}

function Oyin({ oyin, qoshilgan, onQoshil, onOrqaga }) {
  // Qo'shilganlar — ismsiz doiralar; jami doira = nechta odam kerak.
  // Shu sahifada qo'shilgan bo'lsangiz, oxirgi to'la doira ostida «Siz».
  const doiralar = Array.from({ length: oyin.kerak }, (_, i) => i < oyin.qoshilgan)
  return (
    <main className="ekran">
      <button className="orqaga" onClick={onOrqaga}>
        ‹ O'yinlar
      </button>
      <h1>
        {oyin.kun}, {oyin.soat}
      </h1>
      <p className="maydon">{oyin.maydon}</p>
      <p className="hisob">
        <span className="son">{oyin.qoshilgan}</span> / {oyin.kerak}
      </p>
      <div className="doiralar">
        {doiralar.map((toli, i) => (
          <span key={i} className="doira-joy">
            <span className={toli ? 'doira toli' : 'doira'} />
            {qoshilgan && i === oyin.qoshilgan - 1 && <span className="siz">Siz</span>}
          </span>
        ))}
      </div>
      <button className="tugma asosiy" disabled={qoshilgan} onClick={onQoshil}>
        {qoshilgan ? "Qo'shildingiz" : "Qo'shilaman"}
      </button>
    </main>
  )
}

function Elon({ onYubor, onOrqaga }) {
  const [kun, setKun] = useState('')
  const [soat, setSoat] = useState('')
  const [maydon, setMaydon] = useState('')
  const [kerak, setKerak] = useState('')

  function yubor(e) {
    e.preventDefault()
    onYubor({ kun: kun.trim(), soat: soat.trim(), maydon: maydon.trim(), kerak: Number(kerak) })
  }

  return (
    <main className="ekran">
      <button className="orqaga" onClick={onOrqaga}>
        ‹ O'yinlar
      </button>
      <h1>E'lon berish</h1>
      <form className="forma" onSubmit={yubor}>
        <label>
          Kun
          <input value={kun} onChange={(e) => setKun(e.target.value)} placeholder="Yakshanba" required />
        </label>
        <label>
          Soat
          <input value={soat} onChange={(e) => setSoat(e.target.value)} placeholder="19:00" required />
        </label>
        <label>
          Maydon
          <input value={maydon} onChange={(e) => setMaydon(e.target.value)} placeholder="Maktab maydoni" required />
        </label>
        <label>
          Nechta odam
          <input
            type="number"
            min="1"
            value={kerak}
            onChange={(e) => setKerak(e.target.value)}
            placeholder="10"
            required
          />
        </label>
        <button className="tugma asosiy" type="submit">
          Yuborish
        </button>
      </form>
    </main>
  )
}
