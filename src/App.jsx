import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const currency = (n) => (isNaN(+n) ? "" : (+n).toFixed(2));
const isValidRoom = (s) => s.trim().length >= 2 && s.trim().length <= 30;
const isValidPin = (s) => /^\d{4}$/.test(s.trim());

const stepVariants = {
  initial: { opacity: 0, x: 24 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-full text-sm border transition-all active:scale-[0.98] ${
      active
        ? "bg-indigo-600 text-white border-indigo-600 shadow"
        : "bg-white text-gray-800 border-gray-300 hover:border-indigo-400"
    }`}
  >
    {children}
  </button>
);

const StepHeader = ({ step, title, subtitle }) => (
  <div className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-3 bg-white">
    <div className="text-xs tracking-widest uppercase text-gray-500">Step {step}</div>
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="mt-1 text-gray-600 text-sm">{subtitle}</p>}
  </div>
);

export default function App() {
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState({});
  const [members, setMembers] = useState(["Alex", "Sam", "Riley"]);
  const [newMemberName, setNewMemberName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", quantity: 1 });
  const [image, setImage] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [items, setItems] = useState([]);

  const validateRoom = () => {
    const next = {};
    if (!roomName.trim()) {
      next.roomName = "Room name is required.";
    } else if (!isValidRoom(roomName)) {
      next.roomName = "Room name must be 2-30 characters.";
    }
    if (!pin.trim()) {
      next.pin = "PIN is required.";
    } else if (!isValidPin(pin)) {
      next.pin = "PIN must be exactly 4 digits.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleJoin = () => {
    if (!validateRoom()) return;
    setTimeout(() => setStep(2), 200);
  };

  const fileInputRef = useRef(null);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImage({ file: f, url });
    runOcrMock();
  };

  const runOcrMock = async () => {
    setOcrStatus("running");
    await new Promise((r) => setTimeout(r, 1200));
    setItems([
      { id: crypto.randomUUID(), name: "Bananas", price: 2.39, quantity: 2, assignees: [] },
      { id: crypto.randomUUID(), name: "Whole Milk 1gal", price: 3.99, quantity: 1, assignees: [] },
      { id: crypto.randomUUID(), name: "Eggs (dozen)", price: 4.49, quantity: 1, assignees: [] },
      { id: crypto.randomUUID(), name: "Sourdough Bread", price: 5.29, quantity: 1, assignees: [] },
      { id: crypto.randomUUID(), name: "Chicken Breast", price: 9.89, quantity: 3, assignees: [] },
    ]);
    setOcrStatus("done");
    setStep(3);
  };

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const toggleAssignee = (id, member) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const hasMember = it.assignees.includes(member);
        return {
          ...it,
          assignees: hasMember
            ? it.assignees.filter((m) => m !== member)
            : [...it.assignees, member],
        };
      })
    );
  };

  const getUserItems = (member) => {
    return items.filter(item => item.assignees.includes(member)).map(item => ({
      ...item,
      userTotal: (parseFloat(item.price) || 0) * (item.quantity || 1) / item.assignees.length
    }));
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    if (members.length >= 7) return; // Max 7 members
    if (members.includes(newMemberName.trim())) return; // No duplicates
    setMembers(prev => [...prev, newMemberName.trim()]);
    setNewMemberName("");
  };

  const removeMember = (memberToRemove) => {
    if (members.length <= 1) return; // Keep at least 1 member
    setMembers(prev => prev.filter(m => m !== memberToRemove));
    // Remove member from all item assignments
    setItems(prev => prev.map(item => ({
      ...item,
      assignees: item.assignees.filter(a => a !== memberToRemove)
    })));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newItem.name.trim() || !newItem.price.trim()) return;
    const item = {
      id: crypto.randomUUID(),
      name: newItem.name.trim(),
      price: parseFloat(newItem.price) || 0,
      quantity: parseInt(newItem.quantity) || 1,
      assignees: []
    };
    setItems(prev => [...prev, item]);
    setNewItem({ name: "", price: "", quantity: 1 });
  };

  const totals = useMemo(() => {
    const map = Object.fromEntries(members.map((m) => [m, 0]));
    for (const it of items) {
      const p = parseFloat(it.price) * (it.quantity || 1);
      if (!isNaN(p) && it.assignees.length > 0) {
        const split = p / it.assignees.length;
        it.assignees.forEach((a) => {
          map[a] += split;
        });
      }
    }
    return map;
  }, [items, members]);

  const grandTotal = useMemo(
    () => items.reduce((s, it) => (isNaN(+it.price) ? s : s + (+it.price * (it.quantity || 1))), 0),
    [items]
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-50 via-white to-pink-50 text-gray-900 flex items-stretch justify-center">
      <div className="w-full max-w-xl p-4 pb-28">
        <header className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow">RS</div>
            <div>
              <div className="font-semibold leading-tight">Receipt Splitter</div>
              <div className="text-xs text-gray-500 leading-none">Colorful • Fast • Friendly</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600">Room: {roomName || "—"}</div>
            {step > 1 && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Room Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {step === 1 && (
            <motion.section key="step1" variants={stepVariants} initial="initial" animate="enter" exit="exit" className="bg-white/70 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-4">
              <StepHeader step={1} title="Join your room" subtitle="Enter the room name and 4‑digit PIN." />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room name</label>
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g., Grocery Gang" className={`mt-1 w-full rounded-xl border px-3 py-3 bg-white ${errors.roomName ? "border-rose-400 ring-rose-100" : "border-gray-300"}`} />
                  {errors.roomName && <p className="mt-1 text-rose-600 text-xs">{errors.roomName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PIN</label>
                  <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="4 digits" className={`mt-1 w-full rounded-xl border px-3 py-3 bg-white tracking-[0.3em] text-center font-mono text-lg ${errors.pin ? "border-rose-400 ring-rose-100" : "border-gray-300"}`} />
                  {errors.pin && <p className="mt-1 text-rose-600 text-xs">{errors.pin}</p>}
                </div>
                <button onClick={handleJoin} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold shadow">Enter Room</button>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section key="step2" variants={stepVariants} initial="initial" animate="enter" exit="exit" className="bg-white/70 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-4">
              <StepHeader step={2} title="Upload receipt" subtitle="Take a photo or upload an image of your receipt." />
              <div className="space-y-4">
                {!image && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Choose Receipt Image
                    </button>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                  </div>
                )}

                {image && ocrStatus === "idle" && (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden">
                      <img src={image.url} alt="Receipt" className="w-full max-h-64 object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                      >
                        Choose Different Image
                      </button>
                      <button
                        onClick={runOcrMock}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Scan Receipt
                      </button>
                    </div>
                  </div>
                )}

                {ocrStatus === "running" && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                      <span className="text-gray-600">Scanning receipt...</span>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section key="step3" variants={stepVariants} initial="initial" animate="enter" exit="exit" className="bg-white/70 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-4">
              <StepHeader step={3} title="Review & edit items" subtitle="Tap fields to edit names and prices." />
              <div className="space-y-3">
                {items.map((it) => (
                  <motion.div key={it.id} layout className="p-3 rounded-xl border bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <input 
                        value={it.name} 
                        onChange={(e) => updateItem(it.id, { name: e.target.value })} 
                        placeholder="Item name" 
                        className="flex-1 border rounded-lg px-3 py-2 mr-2" 
                      />
                      <button
                        onClick={() => removeItem(it.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-sm">Qty:</span>
                        <input 
                          value={it.quantity || 1} 
                          inputMode="numeric" 
                          onChange={(e) => updateItem(it.id, { quantity: parseInt(e.target.value.replace(/\D/g, "")) || 1 })} 
                          className="w-16 border rounded-lg px-2 py-1 text-center text-sm" 
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">$</span>
                        <input 
                          value={it.price} 
                          inputMode="decimal" 
                          onChange={(e) => updateItem(it.id, { price: e.target.value.replace(/[^0-9.]/g, "") })} 
                          placeholder="0.00" 
                          className="w-20 border rounded-lg px-2 py-1 text-right font-mono text-sm" 
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        = ${currency((parseFloat(it.price) || 0) * (it.quantity || 1))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {members.map((m) => (
                        <Chip key={m} active={it.assignees.includes(m)} onClick={() => toggleAssignee(it.id, m)}>
                          {it.assignees.includes(m) ? "✓ " : ""}{m}
                        </Chip>
                      ))}
                    </div>
                  </motion.div>
                ))}
                
                <div className="p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700 mb-2">Add New Item</div>
                  <div className="space-y-2">
                    <input
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name..."
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-sm">Qty:</span>
                        <input
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value.replace(/\D/g, "")) || 1 }))}
                          className="w-16 border rounded-lg px-2 py-1 text-center text-sm"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-gray-500">$</span>
                        <input
                          value={newItem.price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value.replace(/[^0-9.]/g, "") }))}
                          placeholder="0.00"
                          className="flex-1 border rounded-lg px-2 py-1 text-sm"
                          inputMode="decimal"
                        />
                      </div>
                      <button 
                        onClick={addItem} 
                        className="px-4 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">Grand total</div>
                  <div className="text-lg font-semibold">${currency(grandTotal)}</div>
                </div>
                
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold shadow mt-4"
                >
                  View Split Summary
                </button>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section key="step4" variants={stepVariants} initial="initial" animate="enter" exit="exit" className="bg-white/70 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-4">
              <StepHeader step={4} title="Split summary" subtitle="Totals per person based on assignments." />
              <div className="space-y-3">
                {members.map((m) => {
                  const userItems = getUserItems(m);
                  const isExpanded = expandedUser === m;
                  
                  return (
                    <div key={m} className="border rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : m)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{m}</span>
                          <span className="text-sm text-gray-500">({userItems.length} items)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg">${currency(totals[m])}</span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400"
                          >
                            ▼
                          </motion.div>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="border-t bg-gray-50"
                          >
                            <div className="p-4 space-y-2">
                              {userItems.length > 0 ? (
                                userItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span>{item.name}</span>
                                      <span className="text-gray-500">
                                        (qty: {item.quantity} × ${currency(item.price)} ÷ {item.assignees.length})
                                      </span>
                                    </div>
                                    <span className="font-medium">${currency(item.userTotal)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500 italic">No items assigned</div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                
                <div className="flex items-center justify-between font-bold text-lg pt-4 border-t-2">
                  <span>Grand total</span>
                  <span>${currency(grandTotal)}</span>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors mt-4"
                >
                  Back to Edit Items
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Room Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              {/* Settings Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-4 top-20 bottom-20 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col max-w-md mx-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Room Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Room Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Room Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Room Name:</span>
                        <span className="font-medium">{roomName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">PIN:</span>
                        <span className="font-mono font-medium">{pin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Members Management */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Members</h3>
                      <span className="text-xs text-gray-500">{members.length}/7</span>
                    </div>
                    
                    {/* Current Members */}
                    <div className="space-y-2 mb-4">
                      {members.map((member, index) => (
                        <div key={member} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{member}</span>
                          {members.length > 1 && (
                            <button
                              onClick={() => removeMember(member)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title={`Remove ${member}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add New Member */}
                    {members.length < 7 && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder="Enter member name..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && addMember()}
                          />
                          <button
                            onClick={addMember}
                            disabled={!newMemberName.trim() || members.includes(newMemberName.trim())}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        {members.includes(newMemberName.trim()) && newMemberName.trim() && (
                          <p className="text-xs text-red-600">Member already exists</p>
                        )}
                      </div>
                    )}
                    
                    {members.length >= 7 && (
                      <p className="text-xs text-gray-500 italic">Maximum 7 members allowed</p>
                    )}
                  </div>

                  {/* Statistics */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Room Stats</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="text-lg font-bold text-indigo-600">{items.length}</div>
                        <div className="text-xs text-gray-600">Items</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">${currency(grandTotal)}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Bottom Navigation Pane */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 px-4 py-3">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: "Join Room" },
                { step: 2, label: "Upload Receipt" },
                { step: 3, label: "Edit Items" },
                { step: 4, label: "View Split" }
              ].map(({ step: stepNum, label }, index) => (
                <div key={stepNum} className="flex flex-col items-center relative flex-1">
                  {/* Progress Line */}
                  {index < 3 && (
                    <div className="absolute top-3 left-1/2 w-full h-0.5 bg-gray-200 z-0">
                      <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: "0%" }}
                        animate={{ 
                          width: step > stepNum ? "100%" : "0%" 
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  )}
                  
                  {/* Step Circle */}
                  <motion.div 
                    className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      step === stepNum 
                        ? "bg-indigo-600 text-white shadow-lg" 
                        : step > stepNum 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-200 text-gray-500"
                    }`}
                    animate={{
                      scale: step === stepNum ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {step > stepNum ? "✓" : stepNum}
                  </motion.div>
                  
                  {/* Label */}
                  <motion.span 
                    className={`text-xs mt-2 text-center transition-all duration-300 ${
                      step === stepNum ? "text-indigo-600 font-semibold" : "text-gray-500"
                    }`}
                    animate={{
                      y: step === stepNum ? -2 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {label}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}