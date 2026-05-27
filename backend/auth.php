<?php
header('Content-Type: application/json');
require 'db.php';

// Basic endpoints:
// POST /auth.php?action=register  => {name,email,password,...}
// POST /auth.php?action=login     => {email,password}

$action = $_GET['action'] ?? '';

if($action === 'register'){
  $data = json_decode(file_get_contents('php://input'), true);
  // validate...
  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
  $stmt->execute([$data['email']]);
  if($stmt->fetch()) { echo json_encode(['error'=>'exists']); exit;}
  $pw = password_hash($data['password'], PASSWORD_DEFAULT);
  $stmt = $pdo->prepare("INSERT INTO users (name,email,password,age,weight,height,gender,activity,goal) VALUES (?,?,?,?,?,?,?,?,?)");
  $stmt->execute([$data['name'],$data['email'],$pw,$data['age'],$data['weight'],$data['height'],$data['gender'],$data['activity'],$data['goal']]);
  echo json_encode(['ok'=>true]);
  exit;
}
if($action === 'login'){
  $data = json_decode(file_get_contents('php://input'), true);
  $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
  $stmt->execute([$data['email']]);
  $u = $stmt->fetch(PDO::FETCH_ASSOC);
  if(!$u || !password_verify($data['password'], $u['password'])) { echo json_encode(['error'=>'invalid']); exit; }
  // create session or return user
  unset($u['password']);
  echo json_encode(['user'=>$u]);
  exit;
}
echo json_encode(['error'=>'invalid_action']);
