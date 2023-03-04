-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 04, 2023 at 03:09 AM
-- Server version: 5.7.40-cll-lve
-- PHP Version: 7.4.30

-- SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
-- SET AUTOCOMMIT = 0;
-- START TRANSACTION;
-- SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `xxxxxx`
--

-- --------------------------------------------------------

--
-- Table structure for table `Action`
--

CREATE TABLE `Action` (
  `Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `VisitorID` varchar(20) NOT NULL,
  `IPaddress` varchar(48) DEFAULT NULL,
  `GameCode` enum('AuntyAlice','UncleRemus','SandS','SeniorWrangler','Kings') NOT NULL,
  `Type` varchar(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `Visitor`
--

CREATE TABLE `Visitor` (
  `Name` char(20) NOT NULL,
  `Password` char(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `Visitor`
--

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Action`
--
ALTER TABLE `Action`
  ADD PRIMARY KEY (`Time`,`VisitorID`),
  ADD KEY `idx_Visitor` (`VisitorID`);

--
-- Indexes for table `Visitor`
--
ALTER TABLE `Visitor`
  ADD PRIMARY KEY (`Name`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
