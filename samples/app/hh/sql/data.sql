USE `hh`;

INSERT INTO `patient` (`name`, `ic`, `wardId`) VALUES
('Anthony Marmarou', 'S8012345Z', 1),
('Salomo³n Haki', 'S8112345Z', 1),
('Hans Chiari', 'S8212345Z', 1),
('Edward W.', 'S8312345Z', 2),
('Hedley AA', 'S8412345Z', 2),
('Richard P.', 'S8512345Z', 2);

INSERT INTO `ward` (`name`, `specialty`, `subSpecialty`) VALUES
('KYYH Ward 910C', 'Gerontology', 'Hematology'),
('NYPD Ward 911', 'Oncology', 'Endocrinology');

INSERT INTO `doctor` (`name`, `ic`) VALUES
('Sabharwal Aman', 'S70898376S'),
('Louis-Rene Villere', 'S4268383T');

INSERT INTO `issue` (`patientId`, `doctorId`, `desc`) VALUES
(1, 1, 'diseases caused by biological agents, which can be transmitted to others, rather than by'),
(2, 2, 'important for overall health. Dental treatment is carried out by the dental team'),
(3, 1, 'extraction of teeth, as well as performing examinations, radiographs (x-rays)'),
(4, 2, 'neurological system. It applies physical principles and design concepts to neurophysics seeking to close the ga'),
(5, 1, 'Nemuth Distinguished Professor and Vice Chair of Research in the Departm'),
(6, 2, 'pathologist who described in 1891 a brain malform');

INSERT INTO `transfer` (`issueId`, `requestedId`, `requesterId`) VALUES
(1, 2, 1),
(2, 1, 2),
(3, 2, 1),
(4, 1, 2),
(5, 2, 1),
(6, 1, 2);

INSERT INTO `result` (`issueId`, `desc`) VALUES
(1, 'GL Test Positive'),
(2, 'TS Test Positive'),
(3, 'AB Test Positive'),
(4, 'RU Test Positive'),
(5, 'SY Test Negative'),
(6, 'CE Test Negative');

INSERT INTO `history` (`patientId`, `doctorId`, `reportId`, `issueId`) VALUES
(1, 1, 6, 1),
(2, 1, 5, 2),
(3, 1, 4, 3),
(4, 1, 3, 4),
(5, 1, 2, 5),
(6, 1, 1, 6),
(1, 2, 4, 6),
(2, 2, 3, 5),
(3, 2, 6, 4),
(4, 2, 5, 3),
(5, 2, 1, 2),
(6, 2, 2, 1);
