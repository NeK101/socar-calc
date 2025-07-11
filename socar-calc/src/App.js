import React, { useState, useEffect, useMemo } from "react";

// 하버사인 거리계산(km)
function getDistKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const ZONE_KEY = "socarzone_models_v3";
function loadZones() {
  try { return JSON.parse(localStorage.getItem(ZONE_KEY)) || []; } catch { return []; }
}
function saveZones(zones) { localStorage.setItem(ZONE_KEY, JSON.stringify(zones)); }

function calcFee(km, fee1, fee2, fee3) {
  km = Number(km);
  fee1 = Number(fee1); fee2 = Number(fee2); fee3 = Number(fee3);
  if (km <= 30) return [km * fee1, 0, 0];
  if (km <= 100) return [30 * fee1, (km - 30) * fee2, 0];
  return [30 * fee1, 70 * fee2, (km - 100) * fee3];
}

export default function App() {
  // 데이터
  const [zones, setZones] = useState(loadZones());
  const [newZone, setNewZone] = useState({ name: "", lat: "", lng: "" });
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(-1);

  // 모델
  const [carForm, setCarForm] = useState({ model: "", fee1: 230, fee2: 190, fee3: 175 });
  const [selectedModelIdx, setSelectedModelIdx] = useState(-1);

  // 차량번호
  const [newCarNum, setNewCarNum] = useState("");
  const [selectedCarNum, setSelectedCarNum] = useState("");

  // 검색
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("zone"); // "zone"|"car"
  const [searchRes, setSearchRes] = useState([]);

  // 주행거리 계산
  const [calcKm, setCalcKm] = useState("");

  // GPS
  const [myPos, setMyPos] = useState(null);
  const [nearZoneIdx, setNearZoneIdx] = useState(-1);

  const selectedZone = zones[selectedZoneIdx];
  const selectedModel = selectedZone?.cars?.[selectedModelIdx];

  useEffect(() => { saveZones(zones); }, [zones]);

  // 쏘카존 추가
  function addZone() {
    if (!newZone.name.trim()) return;
    setZones(zs => [...zs, { name: newZone.name.trim(), lat: newZone.lat, lng: newZone.lng, cars: [] }]);
    setNewZone({ name: "", lat: "", lng: "" });
  }
  // 쏘카존 삭제
  function delZone(i) {
    setZones(zs => zs.filter((_, idx) => idx !== i));
    setSelectedZoneIdx(-1); setSelectedModelIdx(-1); setSelectedCarNum("");
  }
  // 모델 추가
  function addModel() {
    if (!carForm.model.trim()) return;
    if (selectedZone.cars.some(c => c.model === carForm.model)) {
      alert("이미 등록된 모델!");
      return;
    }
    setZones(zs => zs.map((z, i) => i === selectedZoneIdx
      ? { ...z, cars: [...(z.cars || []), { ...carForm, numbers: [] }] }
      : z));
    setCarForm({ model: "", fee1: 230, fee2: 190, fee3: 175 });
  }
  // 모델 삭제
  function delModel(idx) {
    setZones(zs => zs.map((z, i) => i === selectedZoneIdx
      ? { ...z, cars: z.cars.filter((_, ci) => ci !== idx) }
      : z));
    setSelectedModelIdx(-1); setSelectedCarNum("");
  }
  // 모델 단가 수정
  function editModelField(field, value) {
    setZones(zs => zs.map((z, i) =>
      i === selectedZoneIdx
        ? { ...z, cars: z.cars.map((c, ci) => ci === selectedModelIdx ? { ...c, [field]: value } : c) }
        : z
    ));
  }
  // 차량번호 추가
  function addCarNum() {
    if (!newCarNum.trim()) return;
    if (selectedModel.numbers.includes(newCarNum.trim())) {
      alert("이미 등록된 차량번호!"); return;
    }
    setZones(zs => zs.map((z, i) => i === selectedZoneIdx
      ? { ...z, cars: z.cars.map((c, ci) => ci === selectedModelIdx
        ? { ...c, numbers: [...c.numbers, newCarNum.trim()] }
        : c) }
      : z));
    setNewCarNum("");
  }
  // 차량번호 삭제
  function delCarNum(num) {
    setZones(zs => zs.map((z, i) => i === selectedZoneIdx
      ? { ...z, cars: z.cars.map((c, ci) => ci === selectedModelIdx
        ? { ...c, numbers: c.numbers.filter(n => n !== num) }
        : c) }
      : z));
    setSelectedCarNum("");
  }

  // 🔎 검색 기능
  useEffect(() => {
    let res = [];
    if (!search) { setSearchRes([]); return; }
    if (searchType === "zone") {
      res = zones
        .map((z, i) => ({ ...z, idx: i }))
        .filter(z => z.name.includes(search));
    } else if (searchType === "car") {
      zones.forEach((z, zi) => {
        z.cars.forEach((c, ci) => {
          c.numbers.forEach(num => {
            if (num.includes(search)) {
              res.push({
                zoneIdx: zi,
                modelIdx: ci,
                num, zone: z.name, model: c.model,
                fee1: c.fee1, fee2: c.fee2, fee3: c.fee3
              });
            }
          });
        });
      });
    }
    setSearchRes(res);
  }, [search, searchType, zones]);

  // 📍 GPS - 가장 가까운 쏘카존
  useEffect(() => {
    if (!myPos || !zones.length) return;
    let minIdx = -1, minDist = Infinity;
    zones.forEach((z, i) => {
      if (z.lat && z.lng) {
        const d = getDistKm(Number(myPos.lat), Number(myPos.lng), Number(z.lat), Number(z.lng));
        if (d < minDist) { minDist = d; minIdx = i; }
      }
    });
    setNearZoneIdx(minIdx);
  }, [myPos, zones]);

  function getMyLocation() {
    if (!navigator.geolocation) {
      alert("GPS 미지원 브라우저");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => alert("위치 권한 필요/오류: " + err.message)
    );
  }

  // 모바일 스타일
  const boxStyle = { border: "1px solid #eee", borderRadius: 12, marginBottom: 18, background: "#fff", padding: 14 };

  return (
    <div style={{ maxWidth: 440, margin: "auto", fontFamily: "sans-serif", padding: 10, background: "#fafcff", minHeight: "100vh" }}>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
      <h2 style={{ textAlign: "center", fontSize: 28, margin: "14px 0" }}>쏘카 차고지/차량 주행요금 계산기</h2>

      {/* 검색 + GPS */}
      <div style={boxStyle}>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ fontSize: 16 }}>
            <option value="zone">차고지명 검색</option>
            <option value="car">차량번호 검색</option>
          </select>
          <input
            style={{ flex: 1, fontSize: 16, border: "1px solid #ccc", borderRadius: 6, padding: 7 }}
            placeholder={searchType === "zone" ? "차고지명 입력" : "차량번호 입력"}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          <button onClick={() => setSearch("")} style={{ fontSize: 15, padding: "7px 12px" }}>초기화</button>
        </div>
        {/* 검색결과 */}
        {searchRes.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {searchType === "zone" ? (
              <ul style={{ paddingLeft: 0 }}>
                {searchRes.map(z => (
                  <li key={z.idx} style={{ listStyle: "none", padding: 7, borderBottom: "1px solid #f3f3f3", cursor: "pointer" }}
                    onClick={() => { setSelectedZoneIdx(z.idx); setSelectedModelIdx(-1); setSelectedCarNum(""); setSearch(""); }}>
                    <b>{z.name}</b>
                    {z.lat && z.lng ? <span style={{ color: "#66c", fontSize: 12 }}> ({z.lat}, {z.lng})</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <ul style={{ paddingLeft: 0 }}>
                {searchRes.map((c, i) => (
                  <li key={i} style={{ listStyle: "none", padding: 7, borderBottom: "1px solid #f3f3f3", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedZoneIdx(c.zoneIdx); setSelectedModelIdx(c.modelIdx);
                      setSelectedCarNum(c.num); setSearch(""); setCalcKm("");
                    }}>
                    <b>{c.zone} / {c.model} / {c.num}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {/* GPS */}
      <div style={boxStyle}>
        <button style={{ width: "100%", padding: 11, fontSize: 16, borderRadius: 8, background: "#30c4bd", color: "white", border: "none" }}
          onClick={getMyLocation}>현재 위치에서 가장 가까운 쏘카존 찾기</button>
        {myPos && (
          <div style={{ fontSize: 15, color: "#666", marginTop: 8 }}>
            내 위치: {myPos.lat?.toFixed(5)}, {myPos.lng?.toFixed(5)}
            {nearZoneIdx >= 0 && zones[nearZoneIdx] &&
              <div style={{ marginTop: 5 }}>
                <b style={{ color: "#348" }}>가장 가까운 쏘카존: {zones[nearZoneIdx].name}</b>
                <button style={{ marginLeft: 10, padding: "5px 13px", fontSize: 14, borderRadius: 6 }}
                  onClick={() => { setSelectedZoneIdx(nearZoneIdx); setSelectedModelIdx(-1); setSelectedCarNum(""); }}>이동</button>
              </div>
            }
          </div>
        )}
      </div>

      {/* 쏘카존 관리 */}
      <div style={boxStyle}>
        <b style={{ fontSize: 18 }}>차고지 목록</b>
        <div style={{ display: "flex", gap: 7, margin: "7px 0" }}>
          <input value={newZone.name} onChange={e => setNewZone(z => ({ ...z, name: e.target.value }))}
            placeholder="쏘카존명" style={{ flex: 1, fontSize: 16, padding: 7, borderRadius: 6 }} />
          <input value={newZone.lat} onChange={e => setNewZone(z => ({ ...z, lat: e.target.value }))}
            placeholder="위도" style={{ width: 90, fontSize: 15, padding: 7, borderRadius: 6 }} />
          <input value={newZone.lng} onChange={e => setNewZone(z => ({ ...z, lng: e.target.value }))}
            placeholder="경도" style={{ width: 90, fontSize: 15, padding: 7, borderRadius: 6 }} />
          <button onClick={addZone} style={{ fontSize: 15, padding: "7px 12px" }}>추가</button>
        </div>
        <ul style={{ paddingLeft: 0 }}>
          {zones.map((z, i) => (
            <li key={i} style={{
              listStyle: "none", padding: 10, borderBottom: "1px solid #f3f3f3",
              background: selectedZoneIdx === i ? "#e0f7fa" : "white", cursor: "pointer"
            }}>
              <span onClick={() => { setSelectedZoneIdx(i); setSelectedModelIdx(-1); setSelectedCarNum(""); }}>
                <b>{z.name}</b> {z.lat && z.lng ? <span style={{ color: "#777", fontSize: 12 }}>({z.lat},{z.lng})</span> : null}
              </span>
              <button style={{ marginLeft: 8, fontSize: 14, padding: "4px 9px", borderRadius: 6 }}
                onClick={() => delZone(i)}>삭제</button>
            </li>
          ))}
        </ul>
      </div>
      {/* 차량모델/번호 */}
      {selectedZone && (
        <div style={boxStyle}>
          <b style={{ fontSize: 17 }}>{selectedZone.name} - 차량모델</b>
          <ul style={{ paddingLeft: 0 }}>
            {(selectedZone.cars || []).map((c, ci) => (
              <li key={ci} style={{
                listStyle: "none", padding: 9, borderBottom: "1px solid #f3f3f3",
                background: selectedModelIdx === ci ? "#f2ffe6" : "white", cursor: "pointer"
              }}>
                <span onClick={() => { setSelectedModelIdx(ci); setSelectedCarNum(""); }}>
                  <b>{c.model}</b> (단가: {c.fee1}/{c.fee2}/{c.fee3})
                </span>
                <button style={{ marginLeft: 8, fontSize: 14, padding: "4px 9px", borderRadius: 6 }}
                  onClick={() => delModel(ci)}>삭제</button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
            <input placeholder="차종" value={carForm.model} onChange={e => setCarForm(f => ({ ...f, model: e.target.value }))}
              style={{ flex: 1, fontSize: 15, padding: 7, borderRadius: 6 }} />
            <input type="number" value={carForm.fee1} style={{ width: 54, fontSize: 15, padding: 7, borderRadius: 6 }} onChange={e => setCarForm(f => ({ ...f, fee1: e.target.value }))} />
            <input type="number" value={carForm.fee2} style={{ width: 54, fontSize: 15, padding: 7, borderRadius: 6 }} onChange={e => setCarForm(f => ({ ...f, fee2: e.target.value }))} />
            <input type="number" value={carForm.fee3} style={{ width: 54, fontSize: 15, padding: 7, borderRadius: 6 }} onChange={e => setCarForm(f => ({ ...f, fee3: e.target.value }))} />
            <button style={{ fontSize: 15, padding: "7px 12px" }} onClick={addModel}>등록</button>
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>단가: 30이하/30~100/100초과, 원/km</div>
        </div>
      )}
      {/* 차량번호 관리 */}
      {selectedZone && selectedModelIdx >= 0 && (
        <div style={boxStyle}>
          <b style={{ fontSize: 17 }}>{selectedModel.model} - 차량번호</b>
          <ul style={{ paddingLeft: 0 }}>
            {selectedModel.numbers.map((num, ni) => (
              <li key={ni} style={{
                listStyle: "none", padding: 8, borderBottom: "1px solid #f3f3f3",
                background: selectedCarNum === num ? "#ffe7f6" : "white", cursor: "pointer"
              }}>
                <span onClick={() => setSelectedCarNum(num)}>{num}</span>
                <button style={{ marginLeft: 8, fontSize: 14, padding: "4px 9px", borderRadius: 6 }}
                  onClick={() => delCarNum(num)}>삭제</button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8, display: "flex", gap: 7 }}>
            <input placeholder="차량번호" value={newCarNum} onChange={e => setNewCarNum(e.target.value)}
              style={{ flex: 1, fontSize: 15, padding: 7, borderRadius: 6 }} />
            <button style={{ fontSize: 15, padding: "7px 12px" }} onClick={addCarNum}>추가</button>
          </div>
        </div>
      )}
      {/* 주행요금 계산기 */}
      {selectedZone && selectedModelIdx >= 0 && selectedCarNum && (
        <div style={{ ...boxStyle, border: "2px solid #8ecae6", background: "#f6fdff" }}>
          <b style={{ fontSize: 18 }}>주행요금 계산 ({selectedZone.name} - {selectedModel.model} - {selectedCarNum})</b>
          <div style={{ marginTop: 11 }}>
            <b>주행거리:</b>
            <input type="number" style={{ width: 110, fontSize: 16, padding: 7, borderRadius: 6, marginLeft: 6 }} value={calcKm}
              onChange={e => setCalcKm(e.target.value)} min="0" placeholder="km" />
            {calcKm && (() => {
              const [s1, s2, s3] = calcFee(calcKm, selectedModel.fee1, selectedModel.fee2, selectedModel.fee3);
              const total = s1 + s2 + s3;
              return (
                <div style={{ marginTop: 10, fontSize: 17 }}>
                  <b>총 주행요금: {total.toLocaleString()} 원</b><br />
                  <span style={{ color: "#888" }}>
                    (30km이하: {s1.toLocaleString()}원,
                    30~100km: {s2.toLocaleString()}원,
                    100km초과: {s3.toLocaleString()}원)
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div style={{ marginTop: 30, fontSize: 13, color: "#bbb", paddingBottom: 30 }}>
        <b>모바일 최적화, GPS, 검색, 차량번호별 관리, Github Pages 배포 지원</b><br />
        <span>로컬스토리지에 영구저장/복원됩니다.</span>
      </div>
    </div>
  );
}
