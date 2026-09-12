/** Decorative offline solve preview. Keep its structure aligned with CbtSolveScreen. */
export function LandingSolvePreview() {
  return (
    <div className="landing-cbt-shell">
      <div className="landing-cbt-topbar">
        <div>
          <span>타이머</span>
          <strong>24:18</strong>
        </div>
        <b>민법 (채권각론)</b>
        <div className="landing-cbt-top-actions">
          <span>일시 중단</span>
          <span>제출 및 종료</span>
        </div>
      </div>

      <div className="landing-cbt-layout">
        <div className="landing-cbt-card">
          <div className="landing-cbt-content">
            <div className="landing-cbt-meta">
              <div>
                <span>1번 / 총 50문항</span>
                <span>채권각론</span>
              </div>
              <div className="landing-cbt-icons" aria-hidden="true"><i>?</i><i>★</i></div>
            </div>
            <h2>
              주택임대차보호법에 따른 임대차에서 그 기간이 끝난 후 임차인이 보증금을 반환받기 위해 목적물을 점유하고 있는 경우에도 여전히 보증금반환채권에 대한 소멸시효는 진행한다고 보아야 한다.
            </h2>
            <div className="landing-cbt-options" aria-label="답안 선택 미리보기">
              <div><span>O</span></div>
              <div className="is-selected">
                <span>X</span>
                <b>다음 문제로 <em>›</em></b>
              </div>
            </div>
          </div>
          <div className="landing-cbt-footer">
            <span>‹ 이전 문제</span>
            <span>다음 문제 ›</span>
          </div>
        </div>

        <aside className="landing-cbt-omr">
          <div><strong>OMR</strong><span>1/50</span></div>
          <div className="landing-cbt-omr-table">
            <p><b>번호</b><b>내 답</b></p>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <p key={item} className={item === 1 ? "is-current" : ""}>
                <span>{item}</span><span>{item === 1 ? "X" : "-"}</span>
              </p>
            ))}
          </div>
          <button type="button" disabled tabIndex={-1}>CSV 다운로드</button>
        </aside>
      </div>
    </div>
  );
}
