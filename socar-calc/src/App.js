import React, { useState } from "react";

// ...loadData/saveData 함수 그대로...

export default function App() {
  const [zones, setZones] = useState(() => loadData("zones", []));
  const [search, setSearch] = useState("");
  const [zoneInput, setZoneInput] = useState("");
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(null);

  // 차량등록/수정, 상세
  const [showCarForm, setShowCarForm] = useState(false);
  const [carFormInput, setCarFormInput] = useState({ model: "", number: "", trim: "", options: "", fee1: "", fee2: "", fee3: "" });
  const [editingCarIdx, setEditingCarIdx] = useState(null);
  const [carDetailIdx, setCarDetailIdx] = useState(null);
  const [calcKm, setCalcKm] = useState("");

  // ...addZone 등 함수 동일...

  // 차량 등록/수정 폼 열기
  function openCarForm(editIdx = null) {
    if (editIdx !== null) {
      // 수정
      setCarFormInput({ ...zones[selectedZoneIdx].cars[editIdx] });
      setEditingCarIdx(editIdx);
    } else {
      setCarFormInput({ model: "", number: "", trim: "", options: "", fee1: "", fee2: "", fee3: "" });
      setEditingCarIdx(null);
    }
    setShowCarForm(true);
  }
  // 차량 등록/수정
  function submitCarForm() {
    const { model, number, trim, options, fee1, fee2, fee3 } = carFormInput;
    if (!model || !number || !fee1 || !fee2 || !fee3) return;
    const z = [...zones];
    if (editingCarIdx !== null) {
      z[selectedZoneIdx].cars[editingCarIdx] = { model, number, trim, options, fee1: +fee1, fee2: +fee2, fee3: +fee3 };
    } else {
      z[selectedZoneIdx].cars.push({ model, number, trim, options, fee1: +fee1, fee2: +fee2, fee3: +fee3 });
    }
    setZones(z);
    saveData("zones", z);
    setShowCarForm(false);
  }

  // 차량 상세/계산기로 이동
  function openCarDetail(idx) {
    setCarDetailIdx(idx);
    setCalcKm("");
  }
  // 차량 상세/계산기 닫기(뒤로가기)
  function closeCarDetail() {
    setCarDetailIdx(null);
    setEditingCarIdx(null);
    setShowCarForm(false);
    setCalcKm("");
  }
  // 요금계산 동일
  function calcFee(km, fee1, fee2, fee3) {
    const n = +km;
    if (n <= 0) return 0;
    let sum = 0;
    if (n <= 30) sum = n * fee1;
    else if (n <= 100) sum = 30 * fee1 + (n - 30) * fee2;
    else sum = 30 * fee1 + 70 * fee2 + (n - 100) * fee3;
    return sum;
  }

  const filteredZones = search.trim()
    ? zones.filter(z => z.name.toLowerCase().includes(search.trim().toLowerCase()))
    : zones;

  // 메인 화면 (쏘카존/차량리스트/등록버튼)
  return (
    <div style={{ maxWidth: 480, margin: "auto", padding: "5vw 2vw", fontFamily: "sans-serif" }}>
      <h2 style={{ fontWeight: 900, marginBottom: 20 }}>쏘카존/차량 관리</h2>

      {/* 검색/쏘카존 등록 */}
      <input
        placeholder="쏘카존 검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", fontSize: 17, padding: 13, borderRadius: 9, marginBottom: 8, border: "1.2px solid #aaa" }}
      />
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        <input
          placeholder="쏘카존명 입력"
          value={zoneInput}
          onChange={e => setZoneInput(e.target.value)}
          style={{ flex: 1, fontSize: 17, padding: 13, borderRadius: 9, border: "1.2px solid #bbb" }}
        />
        <button
          onClick={() => {
            if (!zoneInput.trim()) return;
            const newZones = [...zones, { name: zoneInput.trim(), cars: [] }];
            setZones(newZones); saveData("zones", newZones); setZoneInput("");
          }}
          style={{ fontSize: 17, padding: "13px 16px", borderRadius: 9, background: "#2fc", fontWeight: "bold", border: "none" }}
        >추가</button>
      </div>

      {/* 쏘카존 리스트(카드형) */}
      {filteredZones.map((zone, zi) => (
        <div key={zi}
          style={{
            background: selectedZoneIdx === zi ? "#e6f9fd" : "#fff",
            border: "2px solid #07bbc5", borderRadius: 18,
            margin: "20px 0", padding: "22px 15px",
            fontSize: 19, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 8px #d2faff66"
          }}
          onClick={() => { setSelectedZoneIdx(zi); setCarDetailIdx(null); }}>
          {zone.name}
          <span style={{ color: "#17cfc1", fontSize: 15, marginLeft: 17 }}>
            {zone.cars.length}대 차량
          </span>
        </div>
      ))}

      {/* 차량 리스트/등록(쏘카존 클릭 시) */}
      {selectedZoneIdx !== null && carDetailIdx === null &&
        <div style={{ marginTop: 10, background: "#f8fdff", border: "1.4px solid #09bddf", borderRadius: 16, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 7 }}>
            {zones[selectedZoneIdx].name} - 차량 목록
          </div>
          <ul style={{ padding: 0, margin: 0 }}>
            {zones[selectedZoneIdx].cars.length === 0 &&
              <li style={{ color: "#bbb", fontSize: 15, margin: 6 }}>등록된 차량 없음</li>}
            {zones[selectedZoneIdx].cars.map((car, ci) => (
              <li key={ci} style={{
                listStyle: "none", margin: "13px 0", padding: 14,
                borderRadius: 11, background: "#fff", fontSize: 16,
                boxShadow: "0 1px 4px #cef4fd55", cursor: "pointer", display: "flex", alignItems: "center"
              }} onClick={() => openCarDetail(ci)}>
                <span style={{ flex: 1 }}>{car.model} [{car.number}]</span>
                <button onClick={e => { e.stopPropagation(); openCarForm(ci); }}
                  style={{ fontSize: 13, background: "#eee", border: "none", borderRadius: 7, padding: "6px 12px", marginLeft: 7 }}>수정</button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => openCarForm()}
            style={{
              marginTop: 17, width: "100%", background: "#0ad4ab", color: "#fff",
              fontWeight: 700, border: "none", fontSize: 16, padding: "13px", borderRadius: 9
            }}>
            + 차량 등록
          </button>
        </div>
      }

      {/* 차량 등록/수정 폼(모달 스타일) */}
      {showCarForm &&
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 1000,
          background: "#0007", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: 15, padding: 25, maxWidth: 350, width: "90vw", boxShadow: "0 4px 20px #0002"
          }}>
            <h3 style={{ marginTop: 0 }}>{editingCarIdx !== null ? "차량 정보 수정" : "차량 등록"}</h3>
            <input placeholder="차종 (예: K3)" value={carFormInput.model}
              onChange={e => setCarFormInput(f => ({ ...f, model: e.target.value }))} style={modalInputStyle} />
            <input placeholder="차량번호" value={carFormInput.number}
              onChange={e => setCarFormInput(f => ({ ...f, number: e.target.value }))} style={modalInputStyle} />
            <input placeholder="트림명" value={carFormInput.trim}
              onChange={e => setCarFormInput(f => ({ ...f, trim: e.target.value }))} style={modalInputStyle} />
            <input placeholder="옵션 (콤마구분)" value={carFormInput.options}
              onChange={e => setCarFormInput(f => ({ ...f, options: e.target.value }))} style={modalInputStyle} />
            <input type="number" placeholder="30km↓ 단가" value={carFormInput.fee1}
              onChange={e => setCarFormInput(f => ({ ...f, fee1: e.target.value }))} style={modalInputStyle} />
            <input type="number" placeholder="30~100km 단가" value={carFormInput.fee2}
              onChange={e => setCarFormInput(f => ({ ...f, fee2: e.target.value }))} style={modalInputStyle} />
            <input type="number" placeholder="100km↑ 단가" value={carFormInput.fee3}
              onChange={e => setCarFormInput(f => ({ ...f, fee3: e.target.value }))} style={modalInputStyle} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={submitCarForm}
                style={{ flex: 1, background: "#0ad4ab", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 15, padding: 12 }}>
                {editingCarIdx !== null ? "수정완료" : "등록"}
              </button>
              <button onClick={() => setShowCarForm(false)}
                style={{ flex: 1, background: "#eee", border: "none", borderRadius: 9, fontWeight: 600, fontSize: 15, padding: 12 }}>
                취소
              </button>
            </div>
          </div>
        </div>
      }

      {/* 차량 상세/계산기(새 페이지 느낌, 단일뷰) */}
      {carDetailIdx !== null && selectedZoneIdx !== null &&
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", background: "#fafdff",
          zIndex: 2000, overflowY: "auto"
        }}>
          <div style={{ maxWidth: 420, margin: "auto", padding: "28px 12px" }}>
            <button onClick={closeCarDetail}
              style={{ position: "absolute", left: 18, top: 16, background: "#e9e9e9", borderRadius: 7, fontSize: 14, border: "none", fontWeight: 600, padding: "7px 12px" }}>
              ← 뒤로
            </button>
            <div style={{ textAlign: "center", margin: "35px 0 28px" }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {zones[selectedZoneIdx].cars[carDetailIdx].model} [{zones[selectedZoneIdx].cars[carDetailIdx].number}]
              </div>
              <div style={{ fontSize: 16, color: "#3ac", margin: "11px 0" }}>
                {zones[selectedZoneIdx].cars[carDetailIdx].trim}
              </div>
              <div style={{ fontSize: 15, color: "#666", marginBottom: 14 }}>
                옵션: {zones[selectedZoneIdx].cars[carDetailIdx].options}
              </div>
              <button onClick={() => openCarForm(carDetailIdx)}
                style={{ background: "#0ad4ab", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, padding: "9px 20px", marginTop: 7 }}>
                정보수정
              </button>
            </div>
            <div style={{
              background: "#e8fbff", border: "1.3px solid #08b6f6",
              borderRadius: 13, padding: 19, marginTop: 24
            }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>주행 요금 계산기</div>
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
                      zones[selectedZoneIdx].cars[carDetailIdx].fee1,
                      zones[selectedZoneIdx].cars[carDetailIdx].fee2,
                      zones[selectedZoneIdx].cars[carDetailIdx].fee3
                    ).toLocaleString()
                  } 원</b>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <div style={{ margin: "40px 0 15px", color: "#bbb", fontSize: 13, textAlign: "center" }}>
        쏘카존/차량/요금 자동저장, 모바일최적화<br />
        <span style={{ color: "#7de", fontWeight: 800 }}>by GPT & 시영</span>
      </div>
    </div>
  );
}

const modalInputStyle = {
  width: "100%", fontSize: 15, padding: 10, borderRadius: 8, margin: "5px 0 0 0", border: "1.2px solid #eee"
};
