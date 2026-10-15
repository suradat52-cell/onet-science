/* ลิงก์แหล่งข้อมูล สทศ. */
const NIETS = 'https://www.niets.or.th/th/content/uploads/editor/files/O-NET/';
const PAGE = 'https://www.niets.or.th/th/content/view/';
const BLUEPRINT = { P6: NIETS + 'TB_65SciP6%20O_NET69.pdf', M3: NIETS + 'TB_95SciM3%20O_NET69.pdf' };
// ลิงก์ข้อสอบวิทยาศาสตร์พร้อมเฉลยที่ สทศ. เผยแพร่ (ปีการศึกษา)
const EXAMS = [
  { y: 2568, page: 27057, P6: 'exam_p6_2568/scienceP6.pdf', M3: 'exam_m3_2568/ScienceM368.pdf' },
  { y: 2567, page: 26522, P6: 'exam_p6_2567/sciP6.pdf', M3: 'exam_m3_2567/sciM3-67.pdf' },
  { y: 2566, page: 26039, P6: 'exam_p6_2566/65 วิทยาศาสตร์ ชุด100 สมบูรณ์.pdf', M3: 'exam_m3_2566/95 Science 100-complete.pdf' },
  { y: 2565, page: 25581, P6: 'exam_p6_2565/วิทยาศาสตร์ ป.6.pdf', M3: 'exam_m3_2565/วิทยาศาสตร์ ม.3.pdf' },
  { y: 2564, page: 25230, P6: 'exam_p6_2564/วิทยาศาสตร์ ป6.pdf', M3: 'exam_m3_2564/95 วิทยาศาตร์.pdf' },
  { y: 2563, page: 22345, P6: 'exam_p6_2563/65 วิชาวิทยาศาสตร์.pdf', M3: 'exam_m3_2563/95 วิชาวิทยาศาสตร์.pdf' },
  { y: 2562, page: 17797, P6: 'exam_p6_2562/ข้อสอบและกระดาษคำตอบวิชา 65 วิทย์ 100.pdf', M3: 'exam_m3_2562/ข้อสอบและกระดาษคำตอบวิชา 95 วิทย์ 100 .pdf' },
  { y: 2561, page: 12793, P6: 'exam_p6_2561/65 วิทยาศาสตร์ 100.pdf', M3: 'exam_m3_2561/95 วิทยาศาสตร์ 100.pdf' },
  { y: 2560, page: 7177 }
];
