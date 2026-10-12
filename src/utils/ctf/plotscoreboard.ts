import { createCanvas } from "canvas";

export interface TeamScoreHistory {
  name: string;
  isMe: boolean;
  history: { time: Date; score: number }[];
}

/**
 * 스코어보드 그래프 생성
 * @param data 팀 스코어 히스토리 배열
 * @param figSize 그래프 크기 [너비, 높이] (기본값: [1500, 600])
 * @returns 그래프 이미지 데이터가 포함된 Buffer
 */
export const plotScoreboard = (
  data: TeamScoreHistory[],
  figSize: [number, number] = [1500, 600],
): Buffer => {
  // 색상 설정
  const backgroundColor = "#313338";
  const gridColor = "rgba(128, 128, 128, 0.5)";
  const textColor = "white";

  // 캔버스 생성
  const [width, height] = figSize;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 배경색 설정
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 여백 설정
  const margin = {
    top: 60, // 제목 공간
    right: 150, // 오른쪽 여백 (범례 공간 확보)
    bottom: 70, // x 축 레이블 공간
    left: 70, // y 축 레이블 공간
  };

  // 그래프 영역 계산
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // 제목 설정
  ctx.fillStyle = textColor;
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Top ${data.length} Teams`, width / 2, 30);

  // 데이터 분석 - 시간 및 점수 범위 계산
  let minTime = Number.MAX_SAFE_INTEGER;
  let maxTime = Number.MIN_SAFE_INTEGER;
  let maxScore = 0;

  // 데이터가 있는지 확인
  let hasData = false;

  data.forEach((team) => {
    if (team.history && team.history.length > 0) {
      hasData = true;
      team.history.forEach((point) => {
        const time = point.time.getTime();
        minTime = Math.min(minTime, time);
        maxTime = Math.max(maxTime, time);
        maxScore = Math.max(maxScore, point.score);
      });
    }
  });

  // 데이터가 없으면 "No Data" 메시지 표시
  if (!hasData) {
    ctx.fillStyle = textColor;
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No Data Available", width / 2, height / 2);
    return canvas.toBuffer("image/png");
  }

  // 시간 범위가 너무 작으면 확장
  if (maxTime - minTime < 3600000) {
    // 1시간 미만이면
    const avg = (maxTime + minTime) / 2;
    minTime = avg - 1800000; // 30분
    maxTime = avg + 1800000; // 30분
  }

  // 점수 범위 조정 (0부터 maxScore의 10% 추가)
  maxScore = maxScore * 1.1;

  // 좌표 변환 함수
  const timeToX = (time: number): number => {
    return margin.left + ((time - minTime) / (maxTime - minTime)) * graphWidth;
  };

  const scoreToY = (score: number): number => {
    return height - margin.bottom - (score / maxScore) * graphHeight;
  };

  // X, Y 축 그리기
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([]); // 실선

  // X 축
  ctx.beginPath();
  ctx.moveTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  // Y 축
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.stroke();

  // 그리드 그리기
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]); // 점선 설정

  // X 축 그리드 및 레이블 (시간)
  const timeFormat = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // 6개의 시간 간격 표시
  const numTimeLabels = 6;
  for (let i = 0; i <= numTimeLabels; i++) {
    const t = minTime + (i / numTimeLabels) * (maxTime - minTime);
    const x = timeToX(t);

    // 세로 그리드 선
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, height - margin.bottom);
    ctx.stroke();

    // X 축 레이블
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    const date = new Date(t);
    const label = timeFormat.format(date);
    ctx.translate(x, height - margin.bottom + 25);
    ctx.rotate(Math.PI / 4); // 45도 회전
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  // Y 축 그리드 및 레이블 (점수)
  const numScoreLabels = 10;
  for (let i = 0; i <= numScoreLabels; i++) {
    const s = (i / numScoreLabels) * maxScore;
    const y = scoreToY(s);

    // 가로 그리드 선
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();

    // Y 축 레이블
    ctx.fillStyle = textColor;
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(s).toString(), margin.left - 10, y + 5);
  }

  // 색상 배열 (팀 구분용)
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
    "#aec7e8",
    "#ffbb78",
  ];

  // 범례 항목 추적
  const legends = [];

  // 각 팀별 그래프 그리기
  data.forEach((team, index) => {
    if (!team.history || team.history.length < 2) return; // 최소 2개 이상의 데이터 포인트 필요

    const color = colors[index % colors.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = team.isMe ? 3 : 2; // 우리 팀은 두껍게

    ctx.beginPath();
    let firstPoint = true;

    team.history.forEach((point) => {
      const x = timeToX(point.time.getTime());
      const y = scoreToY(point.score);

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 데이터 포인트 표시
    team.history.forEach((point) => {
      const x = timeToX(point.time.getTime());
      const y = scoreToY(point.score);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 범례 정보 추가
    legends.push({
      name: team.name,
      color: color,
      isMe: team.isMe,
    });
  });

  // 범례 그리기
  const legendX = width - margin.right + 20;
  const legendY = margin.top + 20;
  const legendSpacing = 25;

  legends.forEach((legend, index) => {
    const y = legendY + index * legendSpacing;

    // 라인 표시
    ctx.strokeStyle = legend.color;
    ctx.lineWidth = legend.isMe ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(legendX, y);
    ctx.lineTo(legendX + 30, y);
    ctx.stroke();

    // 텍스트 표시
    ctx.fillStyle = textColor;
    ctx.font = legend.isMe ? "bold 14px Arial" : "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(legend.name, legendX + 40, y + 4);
  });

  // 캔버스를 PNG 버퍼로 변환
  return canvas.toBuffer("image/png");
};
