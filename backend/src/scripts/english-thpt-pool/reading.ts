// Reading pool — 6 passages × 7 câu/passage = 42 câu tổng.
// Difficulty được gán ở seed script (difficulty: 2), KHÔNG lưu ở đây.
// Passage text được chèn vào questionText ở seed script theo format:
//   [Passage]\n<passage>\n\n[Question]\n<questionText>

import { ReadingPassage } from './index';

export const readingPool: ReadingPassage[] = [
  // --- Passage 1: The Internet and Education ---
  {
    passage:
      'The Internet has revolutionized the way people access information and learn new skills. ' +
      'Online education platforms now offer thousands of courses covering topics from programming to art history. ' +
      'Students in remote areas can attend virtual classes taught by world-class instructors without leaving their homes. ' +
      'However, critics argue that online learning lacks the social interaction of traditional classrooms and may reduce students\' motivation. ' +
      'Despite these drawbacks, the flexibility and affordability of online education make it an attractive option for millions of learners worldwide.',
    questions: [
      {
        questionText: 'What is the main idea of the passage?',
        options: [
          { id: 'A', text: 'Online education is superior to traditional classroom learning.', isCorrect: false },
          { id: 'B', text: 'The Internet has transformed education by making learning more accessible.', isCorrect: true },
          { id: 'C', text: 'Students in remote areas face many challenges in education.', isCorrect: false },
          { id: 'D', text: 'Online learning platforms are only suitable for technical subjects.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Đoạn văn nói về tác động của Internet đến giáo dục, đặc biệt là tính tiếp cận.',
      },
      {
        questionText: 'According to the passage, what is one advantage of online education?',
        options: [
          { id: 'A', text: 'It provides more social interaction than traditional classrooms.', isCorrect: false },
          { id: 'B', text: 'It is only available to students in urban areas.', isCorrect: false },
          { id: 'C', text: 'It allows students to learn from expert instructors remotely.', isCorrect: true },
          { id: 'D', text: 'It replaces the need for all traditional schools.', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage nêu học sinh có thể học với giảng viên đẳng cấp thế giới mà không cần rời nhà.',
      },
      {
        questionText: 'What criticism of online learning is mentioned in the passage?',
        options: [
          { id: 'A', text: 'It is too expensive for most students.', isCorrect: false },
          { id: 'B', text: 'It covers too few topics.', isCorrect: false },
          { id: 'C', text: 'It lacks the social interaction of traditional classrooms.', isCorrect: true },
          { id: 'D', text: 'It is unavailable in remote areas.', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Đoạn văn nêu hạn chế: thiếu tương tác xã hội như lớp học truyền thống.',
      },
      {
        questionText: 'The word "revolutionized" in the passage is closest in meaning to:',
        options: [
          { id: 'A', text: 'slightly changed', isCorrect: false },
          { id: 'B', text: 'completely transformed', isCorrect: true },
          { id: 'C', text: 'temporarily affected', isCorrect: false },
          { id: 'D', text: 'gradually improved', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: '"revolutionized" = đã cách mạng hóa, thay đổi hoàn toàn.',
      },
      {
        questionText: 'Which of the following best describes the author\'s attitude toward online education?',
        options: [
          { id: 'A', text: 'Strongly opposed', isCorrect: false },
          { id: 'B', text: 'Completely neutral', isCorrect: false },
          { id: 'C', text: 'Balanced — acknowledging both benefits and drawbacks', isCorrect: true },
          { id: 'D', text: 'Enthusiastically supportive', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Tác giả đề cập cả ưu điểm lẫn nhược điểm, thể hiện góc nhìn cân bằng.',
      },
      {
        questionText: 'Why does the passage mention "remote areas"?',
        options: [
          { id: 'A', text: 'To show that the Internet is unavailable there.', isCorrect: false },
          { id: 'B', text: 'To illustrate that online education benefits students regardless of location.', isCorrect: true },
          { id: 'C', text: 'To argue that rural students prefer traditional schools.', isCorrect: false },
          { id: 'D', text: 'To highlight the cost of building schools in remote areas.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Đề cập "remote areas" để minh họa lợi ích tiếp cận giáo dục không phụ thuộc địa điểm.',
      },
      {
        questionText: 'According to the passage, which TWO factors make online education attractive?',
        options: [
          { id: 'A', text: 'Social interaction and affordability', isCorrect: false },
          { id: 'B', text: 'Flexibility and affordability', isCorrect: true },
          { id: 'C', text: 'Flexibility and social interaction', isCorrect: false },
          { id: 'D', text: 'Affordability and classroom experience', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Câu cuối nêu rõ: "flexibility and affordability" là hai yếu tố hấp dẫn.',
      },
    ],
  },

  // --- Passage 2: Climate Change and Its Effects ---
  {
    passage:
      'Climate change is one of the most pressing issues of our time. Rising global temperatures, caused mainly by the burning of fossil fuels, ' +
      'have led to melting ice caps, rising sea levels, and more frequent extreme weather events. ' +
      'Scientists warn that if current trends continue, many coastal cities could be submerged by 2100. ' +
      'Governments around the world are under pressure to transition to renewable energy sources such as solar and wind power. ' +
      'Individual actions, such as reducing meat consumption and using public transport, also play a role in combating climate change.',
    questions: [
      {
        questionText: 'What is the primary cause of climate change mentioned in the passage?',
        options: [
          { id: 'A', text: 'Deforestation', isCorrect: false },
          { id: 'B', text: 'Burning of fossil fuels', isCorrect: true },
          { id: 'C', text: 'Industrial pollution', isCorrect: false },
          { id: 'D', text: 'Agricultural waste', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage nêu rõ nguyên nhân chính là đốt nhiên liệu hóa thạch.',
      },
      {
        questionText: 'According to scientists, what could happen to coastal cities by 2100?',
        options: [
          { id: 'A', text: 'They will become centers of renewable energy.', isCorrect: false },
          { id: 'B', text: 'They could be submerged due to rising sea levels.', isCorrect: true },
          { id: 'C', text: 'They will experience fewer extreme weather events.', isCorrect: false },
          { id: 'D', text: 'They will be abandoned by 2050.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage cảnh báo nhiều thành phố ven biển có thể bị nhấn chìm vào năm 2100.',
      },
      {
        questionText: 'The word "pressing" in the first sentence is closest in meaning to:',
        options: [
          { id: 'A', text: 'interesting', isCorrect: false },
          { id: 'B', text: 'urgent', isCorrect: true },
          { id: 'C', text: 'complicated', isCorrect: false },
          { id: 'D', text: 'controversial', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: '"pressing issue" = vấn đề cấp bách, cần giải quyết ngay.',
      },
      {
        questionText: 'Which renewable energy sources are mentioned in the passage?',
        options: [
          { id: 'A', text: 'Nuclear and hydro power', isCorrect: false },
          { id: 'B', text: 'Solar and wind power', isCorrect: true },
          { id: 'C', text: 'Geothermal and tidal power', isCorrect: false },
          { id: 'D', text: 'Biomass and solar power', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage đề cập "solar and wind power" là hai nguồn năng lượng tái tạo.',
      },
      {
        questionText: 'What individual actions does the passage suggest for combating climate change?',
        options: [
          { id: 'A', text: 'Installing solar panels and planting trees', isCorrect: false },
          { id: 'B', text: 'Reducing meat consumption and using public transport', isCorrect: true },
          { id: 'C', text: 'Boycotting fossil fuel companies', isCorrect: false },
          { id: 'D', text: 'Voting for green political parties', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage liệt kê: giảm tiêu thụ thịt và sử dụng phương tiện công cộng.',
      },
      {
        questionText: 'The passage suggests that governments should:',
        options: [
          { id: 'A', text: 'ban all fossil fuel use immediately.', isCorrect: false },
          { id: 'B', text: 'relocate coastal cities.', isCorrect: false },
          { id: 'C', text: 'transition to renewable energy sources.', isCorrect: true },
          { id: 'D', text: 'invest in nuclear energy exclusively.', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage nêu áp lực lên chính phủ là chuyển sang năng lượng tái tạo.',
      },
      {
        questionText: 'Which of the following is NOT mentioned as an effect of rising global temperatures?',
        options: [
          { id: 'A', text: 'Melting ice caps', isCorrect: false },
          { id: 'B', text: 'Rising sea levels', isCorrect: false },
          { id: 'C', text: 'Increased food production', isCorrect: true },
          { id: 'D', text: 'More frequent extreme weather events', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage không đề cập đến "increased food production"; các hiệu ứng khác đều được nêu.',
      },
    ],
  },

  // --- Passage 3: The Benefits of Reading ---
  {
    passage:
      'Reading is one of the most beneficial habits a person can develop. Research shows that regular reading improves vocabulary, ' +
      'enhances concentration, and reduces stress levels. Fiction, in particular, develops empathy by allowing readers to experience ' +
      'life through different perspectives. Non-fiction reading keeps people informed about current events and expands their knowledge base. ' +
      'In an age dominated by social media and short video content, cultivating a reading habit requires conscious effort, ' +
      'but the long-term cognitive and emotional benefits make it worthwhile.',
    questions: [
      {
        questionText: 'What is the main purpose of the passage?',
        options: [
          { id: 'A', text: 'To compare fiction and non-fiction books', isCorrect: false },
          { id: 'B', text: 'To argue that social media is harmful', isCorrect: false },
          { id: 'C', text: 'To highlight the benefits of regular reading', isCorrect: true },
          { id: 'D', text: 'To explain how to develop better study habits', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Toàn bộ đoạn văn tập trung vào lợi ích của việc đọc sách thường xuyên.',
      },
      {
        questionText: 'According to the passage, how does fiction reading benefit readers?',
        options: [
          { id: 'A', text: 'It improves mathematical skills.', isCorrect: false },
          { id: 'B', text: 'It develops empathy through different perspectives.', isCorrect: true },
          { id: 'C', text: 'It keeps readers informed about current events.', isCorrect: false },
          { id: 'D', text: 'It reduces the need for social interaction.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage nêu: văn học hư cấu phát triển sự đồng cảm qua trải nghiệm góc nhìn khác nhau.',
      },
      {
        questionText: 'The word "cultivating" in the passage is closest in meaning to:',
        options: [
          { id: 'A', text: 'destroying', isCorrect: false },
          { id: 'B', text: 'ignoring', isCorrect: false },
          { id: 'C', text: 'developing', isCorrect: true },
          { id: 'D', text: 'measuring', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: '"cultivating a habit" = xây dựng/phát triển thói quen.',
      },
      {
        questionText: 'Why does the author mention social media in the passage?',
        options: [
          { id: 'A', text: 'To recommend social media as an alternative to reading', isCorrect: false },
          { id: 'B', text: 'To explain why developing a reading habit takes effort', isCorrect: true },
          { id: 'C', text: 'To argue that social media improves literacy', isCorrect: false },
          { id: 'D', text: 'To compare reading time with screen time', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Tác giả đề cập mạng xã hội như thách thức khiến việc duy trì thói quen đọc cần nỗ lực.',
      },
      {
        questionText: 'Which of the following benefits of reading is NOT mentioned?',
        options: [
          { id: 'A', text: 'Improved vocabulary', isCorrect: false },
          { id: 'B', text: 'Enhanced concentration', isCorrect: false },
          { id: 'C', text: 'Better physical health', isCorrect: true },
          { id: 'D', text: 'Reduced stress', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage không đề cập "better physical health" — các lợi ích nêu đều là nhận thức và cảm xúc.',
      },
      {
        questionText: 'What does the author imply by saying the benefits "make it worthwhile"?',
        options: [
          { id: 'A', text: 'Reading is not difficult for most people.', isCorrect: false },
          { id: 'B', text: 'The effort required to read regularly is justified by its benefits.', isCorrect: true },
          { id: 'C', text: 'Only non-fiction reading is truly beneficial.', isCorrect: false },
          { id: 'D', text: 'Reading is a competitive skill in the job market.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: '"make it worthwhile" = đáng công sức bỏ ra — tức lợi ích bù đắp cho nỗ lực cần thiết.',
      },
      {
        questionText: 'Non-fiction reading, according to the passage, primarily helps readers:',
        options: [
          { id: 'A', text: 'develop their imagination.', isCorrect: false },
          { id: 'B', text: 'stay informed and expand their knowledge.', isCorrect: true },
          { id: 'C', text: 'manage their emotional responses.', isCorrect: false },
          { id: 'D', text: 'improve their writing style.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage nêu non-fiction "keeps people informed about current events and expands their knowledge base".',
      },
    ],
  },

  // --- Passage 4: Urbanization and Its Challenges ---
  {
    passage:
      'Urbanization — the movement of people from rural to urban areas — is accelerating globally. ' +
      'By 2050, it is estimated that nearly 70% of the world\'s population will live in cities. ' +
      'While cities offer better job opportunities, healthcare, and education, rapid urbanization creates significant challenges. ' +
      'Traffic congestion, housing shortages, and environmental pollution are common problems in fast-growing cities. ' +
      'City planners must develop smart, sustainable solutions such as efficient public transport systems, green spaces, ' +
      'and affordable housing to ensure cities remain livable for all residents.',
    questions: [
      {
        questionText: 'What is the passage mainly about?',
        options: [
          { id: 'A', text: 'The decline of rural communities worldwide', isCorrect: false },
          { id: 'B', text: 'The trend of urbanization and its associated challenges', isCorrect: true },
          { id: 'C', text: 'Specific solutions to traffic congestion', isCorrect: false },
          { id: 'D', text: 'The benefits of living in rural areas', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Bài đọc tổng quan về xu hướng đô thị hóa và các thách thức đi kèm.',
      },
      {
        questionText: 'According to the passage, what percentage of people will live in cities by 2050?',
        options: [
          { id: 'A', text: '50%', isCorrect: false },
          { id: 'B', text: '60%', isCorrect: false },
          { id: 'C', text: '70%', isCorrect: true },
          { id: 'D', text: '80%', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage ước tính gần 70% dân số thế giới sẽ sống ở thành phố vào năm 2050.',
      },
      {
        questionText: 'Which of the following is listed as an advantage of cities?',
        options: [
          { id: 'A', text: 'Less traffic congestion', isCorrect: false },
          { id: 'B', text: 'More affordable housing', isCorrect: false },
          { id: 'C', text: 'Better job opportunities', isCorrect: true },
          { id: 'D', text: 'Cleaner environment', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage liệt kê lợi thế: cơ hội việc làm, y tế, giáo dục tốt hơn.',
      },
      {
        questionText: 'The word "livable" in the passage means:',
        options: [
          { id: 'A', text: 'affordable', isCorrect: false },
          { id: 'B', text: 'suitable for comfortable living', isCorrect: true },
          { id: 'C', text: 'environmentally friendly', isCorrect: false },
          { id: 'D', text: 'technologically advanced', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: '"livable" = có thể sống được, đáng sống — chỉ môi trường thoải mái và phù hợp.',
      },
      {
        questionText: 'Which problem of rapid urbanization is NOT mentioned?',
        options: [
          { id: 'A', text: 'Traffic congestion', isCorrect: false },
          { id: 'B', text: 'Housing shortages', isCorrect: false },
          { id: 'C', text: 'Environmental pollution', isCorrect: false },
          { id: 'D', text: 'Rising crime rates', isCorrect: true },
        ],
        correctAnswer: 'D',
        explanation: 'Passage không đề cập "crime rates"; ba vấn đề còn lại đều được nêu.',
      },
      {
        questionText: 'What solutions does the passage propose for urban challenges?',
        options: [
          { id: 'A', text: 'Limiting migration to cities', isCorrect: false },
          { id: 'B', text: 'Efficient public transport, green spaces, and affordable housing', isCorrect: true },
          { id: 'C', text: 'Building more highways and parking lots', isCorrect: false },
          { id: 'D', text: 'Moving industries to rural areas', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage liệt kê 3 giải pháp: giao thông công cộng hiệu quả, không gian xanh, nhà ở giá cả phải chăng.',
      },
      {
        questionText: 'The tone of the passage can best be described as:',
        options: [
          { id: 'A', text: 'alarmist and pessimistic', isCorrect: false },
          { id: 'B', text: 'informative and solution-oriented', isCorrect: true },
          { id: 'C', text: 'critical of city planners', isCorrect: false },
          { id: 'D', text: 'nostalgic about rural life', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Bài đọc cung cấp thông tin về vấn đề và đề xuất giải pháp — tông điệu thông tin và định hướng giải pháp.',
      },
    ],
  },

  // --- Passage 5: Artificial Intelligence in Healthcare ---
  {
    passage:
      'Artificial intelligence (AI) is rapidly transforming the healthcare industry. Machine learning algorithms can now analyze medical ' +
      'images with accuracy comparable to experienced radiologists, enabling earlier detection of diseases such as cancer. ' +
      'AI-powered chatbots provide patients with 24/7 access to basic medical advice, reducing the burden on healthcare systems. ' +
      'However, concerns remain about data privacy, algorithmic bias, and the potential for AI to replace human doctors. ' +
      'Experts argue that AI should be seen as a tool that assists medical professionals rather than a replacement for them.',
    questions: [
      {
        questionText: 'What is the main topic of the passage?',
        options: [
          { id: 'A', text: 'The dangers of AI replacing doctors', isCorrect: false },
          { id: 'B', text: 'How AI is being used in the healthcare industry', isCorrect: true },
          { id: 'C', text: 'The history of medical technology', isCorrect: false },
          { id: 'D', text: 'Data privacy issues in modern hospitals', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Bài đọc tổng quan về ứng dụng AI trong y tế, bao gồm cả lợi ích và lo ngại.',
      },
      {
        questionText: 'According to the passage, AI can analyze medical images with accuracy comparable to:',
        options: [
          { id: 'A', text: 'general practitioners', isCorrect: false },
          { id: 'B', text: 'experienced radiologists', isCorrect: true },
          { id: 'C', text: 'medical students', isCorrect: false },
          { id: 'D', text: 'AI chatbots', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage nêu: độ chính xác của AI "comparable to experienced radiologists".',
      },
      {
        questionText: 'What is one benefit of AI-powered chatbots mentioned in the passage?',
        options: [
          { id: 'A', text: 'They can perform surgery.', isCorrect: false },
          { id: 'B', text: 'They provide medical advice around the clock.', isCorrect: true },
          { id: 'C', text: 'They replace the need for medical professionals.', isCorrect: false },
          { id: 'D', text: 'They eliminate data privacy concerns.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Chatbot AI cung cấp tư vấn y tế cơ bản 24/7, giảm tải hệ thống y tế.',
      },
      {
        questionText: 'The word "burden" in the passage is closest in meaning to:',
        options: [
          { id: 'A', text: 'cost', isCorrect: false },
          { id: 'B', text: 'risk', isCorrect: false },
          { id: 'C', text: 'pressure/load', isCorrect: true },
          { id: 'D', text: 'benefit', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: '"burden" = gánh nặng, áp lực.',
      },
      {
        questionText: 'Which concern about AI in healthcare is NOT mentioned?',
        options: [
          { id: 'A', text: 'Data privacy', isCorrect: false },
          { id: 'B', text: 'Algorithmic bias', isCorrect: false },
          { id: 'C', text: 'High implementation cost', isCorrect: true },
          { id: 'D', text: 'Potential replacement of doctors', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage không đề cập chi phí triển khai; ba mối lo ngại còn lại đều được nêu.',
      },
      {
        questionText: 'What is the experts\' view on AI in healthcare?',
        options: [
          { id: 'A', text: 'AI should immediately replace all doctors.', isCorrect: false },
          { id: 'B', text: 'AI is too unreliable for medical use.', isCorrect: false },
          { id: 'C', text: 'AI should assist medical professionals, not replace them.', isCorrect: true },
          { id: 'D', text: 'AI should only be used for administrative tasks.', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Experts cho rằng AI nên là công cụ hỗ trợ bác sĩ chứ không thay thế họ.',
      },
      {
        questionText: 'Which disease is specifically mentioned as detectable through AI image analysis?',
        options: [
          { id: 'A', text: 'Diabetes', isCorrect: false },
          { id: 'B', text: 'Heart disease', isCorrect: false },
          { id: 'C', text: 'Cancer', isCorrect: true },
          { id: 'D', text: 'Alzheimer\'s', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage đề cập phát hiện sớm bệnh "such as cancer" qua phân tích hình ảnh y tế.',
      },
    ],
  },

  // --- Passage 6: Plastic Pollution in the Ocean ---
  {
    passage:
      'Plastic pollution has become one of the most serious environmental problems facing our oceans today. ' +
      'An estimated 8 million metric tons of plastic enter the ocean every year, harming marine wildlife and ecosystems. ' +
      'Sea turtles, seabirds, and fish often mistake plastic debris for food, leading to starvation and death. ' +
      'Microplastics — tiny plastic particles — have been found in fish consumed by humans, raising concerns about health risks. ' +
      'Efforts to address this crisis include international bans on single-use plastics, beach clean-up campaigns, ' +
      'and the development of biodegradable alternatives to conventional plastic products.',
    questions: [
      {
        questionText: 'What is the passage mainly discussing?',
        options: [
          { id: 'A', text: 'Methods for recycling plastic waste', isCorrect: false },
          { id: 'B', text: 'The impact of plastic pollution on oceans and efforts to address it', isCorrect: true },
          { id: 'C', text: 'The history of plastic manufacturing', isCorrect: false },
          { id: 'D', text: 'Government policies on environmental protection', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Bài đọc trình bày tác động ô nhiễm nhựa đến đại dương và các biện pháp giải quyết.',
      },
      {
        questionText: 'How much plastic enters the ocean each year according to the passage?',
        options: [
          { id: 'A', text: '4 million metric tons', isCorrect: false },
          { id: 'B', text: '6 million metric tons', isCorrect: false },
          { id: 'C', text: '8 million metric tons', isCorrect: true },
          { id: 'D', text: '10 million metric tons', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'Passage nêu con số ước tính: 8 triệu tấn nhựa mỗi năm.',
      },
      {
        questionText: 'Why is plastic debris dangerous to sea turtles and seabirds?',
        options: [
          { id: 'A', text: 'It entangles them and prevents movement.', isCorrect: false },
          { id: 'B', text: 'They mistake it for food, causing starvation.', isCorrect: true },
          { id: 'C', text: 'It contaminates their water supply.', isCorrect: false },
          { id: 'D', text: 'It destroys their nesting habitats.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage nêu: động vật biển nhầm rác nhựa là thức ăn, dẫn đến đói và chết.',
      },
      {
        questionText: 'The word "debris" in the passage is closest in meaning to:',
        options: [
          { id: 'A', text: 'food waste', isCorrect: false },
          { id: 'B', text: 'scattered rubbish/waste material', isCorrect: true },
          { id: 'C', text: 'chemical pollutants', isCorrect: false },
          { id: 'D', text: 'natural sediment', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: '"debris" = mảnh vụn, rác thải rải rác.',
      },
      {
        questionText: 'What human health concern related to plastic is mentioned?',
        options: [
          { id: 'A', text: 'Skin irritation from contact with plastic', isCorrect: false },
          { id: 'B', text: 'Microplastics found in fish consumed by humans', isCorrect: true },
          { id: 'C', text: 'Air pollution from burning plastic', isCorrect: false },
          { id: 'D', text: 'Contamination of drinking water from plastic bottles', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage nêu lo ngại sức khỏe: vi nhựa tìm thấy trong cá mà con người ăn.',
      },
      {
        questionText: 'Which of the following is mentioned as a solution to plastic pollution?',
        options: [
          { id: 'A', text: 'Taxing plastic manufacturers', isCorrect: false },
          { id: 'B', text: 'International bans on single-use plastics', isCorrect: true },
          { id: 'C', text: 'Building more recycling facilities', isCorrect: false },
          { id: 'D', text: 'Reducing ocean shipping traffic', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'Passage liệt kê: lệnh cấm quốc tế với nhựa dùng một lần là một trong các biện pháp.',
      },
      {
        questionText: 'The word "biodegradable" in the passage refers to materials that:',
        options: [
          { id: 'A', text: 'are made from recycled plastic.', isCorrect: false },
          { id: 'B', text: 'can be broken down naturally by the environment.', isCorrect: true },
          { id: 'C', text: 'are cheaper than conventional plastics.', isCorrect: false },
          { id: 'D', text: 'are produced without harmful chemicals.', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: '"biodegradable" = có thể phân hủy sinh học — tức môi trường có thể phân giải tự nhiên.',
      },
    ],
  },
];
