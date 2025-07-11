import React, { useState } from "react";

// 쏘카존, 차량, 옵션, 주행요금 데이터 구조
function loadData(key, defaultValue) {
  try { return JSON.parse(localStorage.getItem(key)) || defaultValue; }
  catch { return defaultValue; }
}
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function App() {
  // 상태
  const [zones, setZones] = useState(() => loadData("zones", []));
  const [search, setSearch] = useState("");
  const [zoneInput, setZoneInput] = useState("");
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(null);

  const [carInput, setCarInput] = useState({ model: "", number: "", fee1: "", fee2: "", fee3: "" });
  const [selectedCarIdx, setSelectedCarIdx] = useState(null);
  const [calcKm, setCalcKm] = useState("");

  // 쏘카존 추가
  function addZone() {
    if (!zoneInput.trim()) return;
    const newZones = [...zones, { name: zoneInput.trim(), cars: [] }];
    setZones(newZones);
    saveData("zones", newZones);
    setZoneInput("");
  }

  // 쏘카존 클릭
  function selectZone(i) {
    setSelectedZoneIdx(i);
    setSelectedCarIdx(null);
    setCalcKm("");
  }

  // 차량 추가
  function addCar() {
    const { model, number, fee1, fee2, fee3 } = carInput;
    if (!model || !number || !fee1 || !fee2 || !fee3) return;
    const z = [...zones];
    z[selectedZoneIdx].cars.push({
      model: model.trim(),
      number: number.trim(),
      fee1: +fee1,
      fee2: +fee2,
      fee3: +fee3
    });
    setZones(z);
    saveData("zones", z);
    setCarInput({ model: "", number: "", fee1: "", fee2: "", fee3: "" });
  }

  // 차량 클릭
  function selectCar(i) {
    setSelectedCarIdx(i);
    setCalcKm("");
  }

  // 요금 계산
  function calcFee(km, fee1, fee2, fee3) {
    const n = +km;
    if (n <= 0) return 0;
    let sum = 0;
    if (n <= 30) sum = n * fee1;
    else if (n <= 100) sum = 30 * fee1 + (n - 30) * fee2;
    else sum = 30 * fee1 + 70 * fee2 + (n - 100) * fee3;
    return sum;
  }

  // 쏘카존 실시간 검색(포함 문자열)
  const filteredZones = search.trim()
    ? zones.filter(z => z.name.toLowerCase().includes(search.trim().toLowerCase()))
    : zones;

  return (
    <div style={{ maxWidth: 430, margin: "auto", padding: "4vw 2vw", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 16, fontWeight: 900 }}>쏘카존/차량 관리 & 요금 계산기</h2>

      {/* 쏘카존 검색 + 등록 */}
      <input
        placeholder="쏘카존 검색 (예: 기장)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, marginBottom: 8, border: "1px solid #ccc" }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          placeholder="쏘카존명 입력"
          value={zoneInput}
          onChange={e => setZoneInput(e.target.value)}
          style={{ flex: 1, fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #bbb" }}
        />
        <button
          onClick={addZone}
          style={{ fontSize: 16, padding: "12px 18px", borderRadius: 8, background: "#2fc", fontWeight: "bold", border: "none" }}
        >추가</button>
      </div>

      {/* 쏘카존 리스트 */}
      <div>
        {filteredZones.length === 0 && <div style={{ color: "#bbb", fontSize: 15 }}>검색 결과 없음</div>}
        {filteredZones.map((zone, zi) => (
          <div key={zi} style={{
            margin: "8px 0", background: selectedZoneIdx === zi ? "#e6faff" : "#fff",
            border: "1.5px solid #0bc", borderRadius: 12, padding: "12px 10px", cursor: "pointer"
          }}
            onClick={() => selectZone(zi)}>
            <b style={{ fontSize: 16 }}>{zone.name}</b>
            <span style={{ color: "#2ac", marginLeft: 12, fontSize: 13 }}>
              {zone.cars.length}대 차량
            </span>
          </div>
        ))}
      </div>

      {/* 쏘카존 클릭 시 차량 리스트+등록 */}
      {selectedZoneIdx !== null &&
        <div style={{ marginTop: 28, border: "1.5px solid #aaa", borderRadius: 12, padding: 18 }}>
          <b style={{ fontSize: 17 }}>{zones[selectedZoneIdx].name} - 차량 목록</b>
          <ul style={{ paddingLeft: 0, marginTop: 10 }}>
            {zones[selectedZoneIdx].cars.length === 0 && <li style={{ color: "#bbb", fontSize: 15 }}>등록된 차량 없음</li>}
            {zones[selectedZoneIdx].cars.map((car, ci) => (
              <li key={ci} style={{
                listStyle: "none", padding: 8, borderBottom: "1px solid #f3f3f3",
                background: selectedCarIdx === ci ? "#f5faff" : "white", cursor: "pointer"
              }}
                onClick={() => selectCar(ci)}>
                <span>{car.model} [{car.number}]</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16 }}>
            <b style={{ fontSize: 15 }}>차량 등록</b>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              <input
                placeholder="차종 (예: K3)"
                value={carInput.model}
                onChange={e => setCarInput(f => ({ ...f, model: e.target.value }))}
                style={{ fontSize: 15, padding: 9, borderRadius: 6 }}
              />
              <input
                placeholder="차량번호"
                value={carInput.number}
                onChange={e => setCarInput(f => ({ ...f, number: e.target.value }))}
                style={{ fontSize: 15, padding: 9, borderRadius: 6 }}
              />
              <div style={{ display: "flex", gap: 5 }}>
                <input
                  type="number" placeholder="30km↓ 단가"
                  value={carInput.fee1}
                  onChange={e => setCarInput(f => ({ ...f, fee1: e.target.value }))}
                  style={{ width: "33%", fontSize: 15, padding: 9, borderRadius: 6 }}
                />
                <input
                  type="number" placeholder="30~100km 단가"
                  value={carInput.fee2}
                  onChange={e => setCarInput(f => ({ ...f, fee2: e.target.value }))}
                  style={{ width: "33%", fontSize: 15, padding: 9, borderRadius: 6 }}
                />
                <input
                  type="number" placeholder="100km↑ 단가"
                  value={carInput.fee3}
                  onChange={e => setCarInput(f => ({ ...f, fee3: e.target.value }))}
                  style={{ width: "33%", fontSize: 15, padding: 9, borderRadius: 6 }}
                />
              </div>
              <button
                onClick={addCar}
                style={{ fontSize: 15, padding: "10px 0", borderRadius: 7, background: "#0bd", color: "#fff", fontWeight: "bold", marginTop: 8 }}
              >차량 등록</button>
              <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                단가: 30km↓, 30~100km, 100km↑ 순, 원/km
              </div>
            </div>
          </div>
        </div>
      }

      {/* 차량 선택 시 요금 계산기 */}
      {selectedZoneIdx !== null && selectedCarIdx !== null &&
        <div style={{
          marginTop: 22, background: "#f7feff", border: "1.5px solid #08b6f6",
          borderRadius: 13, padding: 16
        }}>
          <b style={{ fontSize: 17 }}>{zones[selectedZoneIdx].cars[selectedCarIdx].model} [{zones[selectedZoneIdx].cars[selectedCarIdx].number}] 요금 계산기</b>
          <div style={{ marginTop: 11 }}>
            <input
              type="number" min="0"
              value={calcKm}
              onChange={e => setCalcKm(e.target.value)}
              placeholder="주행거리 (km)"
              style={{ width: "100%", fontSize: 16, padding: 10, borderRadius: 7, marginBottom: 7 }}
            />
            {calcKm &&
              <div style={{ marginTop: 7, fontSize: 17, color: "#333" }}>
                <b>총 주행요금: {
                  calcFee(calcKm,
                    zones[selectedZoneIdx].cars[selectedCarIdx].fee1,
                    zones[selectedZoneIdx].cars[selectedCarIdx].fee2,
                    zones[selectedZoneIdx].cars[selectedCarIdx].fee3
                  ).toLocaleString()
                } 원</b>
              </div>
            }
          </div>
        </div>
      }
      <div style={{ margin: "36px 0 12px", color: "#bbb", fontSize: 13 }}>
        쏘카존/차량/요금 모두 <b>로컬에 자동저장</b>됩니다.
      </div>
    </div>
  );
}
