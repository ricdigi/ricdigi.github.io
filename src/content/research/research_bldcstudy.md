---
title: "Study of a BLDC motor driver, and control"
description: "Documentation on theory and prototypes."
thumbnail: "/img/research/research_image_bldc.png"
filename: "research_bldcstudy.html"
group: "Robotics Hardware and Control"
order: 2
---

# Study on BLDC Motor Drivers and Control Strategies

This page documents ongoing research, theory, and experimental work on **BLDC motor drivers** and **control techniques**. The focus is on understanding the core electronics involved in driving brushless motors and exploring various control strategies through practical prototyping.

The initial development phase involved building a **triple half-bridge circuit** using discrete MOSFETs. Gate driving was achieved with **bipolar junction transistors** — not ideal for high-speed switching, but sufficient for early experimentation using available components. The control logic is currently handled by an **Arduino**, enabling quick iterations and testing.

To enable **rotor position feedback**, a **magnetic rotary encoder** was later integrated, allowing exploration of more advanced control approaches beyond open-loop methods.

> ⚠️ **Note:**
> This page is still a work in progress. At present, only **six-step commutation** with **rotor position feedback** has been implemented. The final goal is to develop a complete **Field-Oriented Control (FOC)** strategy.

Among the resources consulted throughout this project, I would like to especially thank the [JTLee YouTube channel](https://www.youtube.com/@jtlee1108) for its clear and intuitive explanations on motor control.

# Components and Circuit Analysis
In the first phase of this research, I focused on the fundamental components involved in BLDC motor control—namely **MOSFETs**, **gate drivers**, and the **half-bridge circuit**. The objective was to understand how these elements interact to drive the motor efficiently.

For prototyping, I worked with components already available: **MOSFET ICs (W342) salvaged from broken servo motors** and **BJTs (BC337)** used to drive the gates—an unconventional but practical choice for early testing. The motor used is a **T-Motor GB54-1**, a BLDC motor with **14 poles** and **12 stator slots**.

A basic **3D-printed motor mount** was created to support both the motor and a **magnetic rotary encoder (AS5600)**, aligned on the same shaft. This encoder provides **rotor position feedback**, which is essential for future development of advanced control techniques like **Field-Oriented Control (FOC)**.

## Background on MOSFETs

A MOSFET (Metal-Oxide-Semiconductor Field-Effect Transistor) is a type of transistor widely used for switching and amplification in electronic circuits. Unlike bipolar junction transistors (BJTs), MOSFETs control current using an electric field, making them highly efficient and suitable for high-speed applications.

Structurally, a typical **N-channel MOSFET** is built on a **P-type semiconductor substrate**. Into this substrate, two heavily **N-doped regions** are diffused—these form the **source** and **drain terminals**, which provide the carriers (electrons) for conduction. The area between the source and drain, still part of the P-type substrate, is called the **channel region**; initially, it is non-conductive.

Above this channel region, a thin insulating layer of **silicon dioxide**(SiO₂) is grown—this serves as the **oxide layer**. Finally, a layer of **metal** is deposited directly on top of the oxide to form the **gate terminal**. This arrangement gives the device its name: **Metal-Oxide-Semiconductor Field-Effect Transistor** (MOSFET) (Image Source: https://commons.wikimedia.org/wiki/File:Mosfet_cross_section-sv.svg).

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_1.png" alt="Nchannel mosfet" style="max-width:100%; height:auto;">
</p>

A **P-channel MOSFET**, instead, has two heavily **P-doped regions** corresponding to the **source** and **drain**, while the underlying **substrate** is **N-type**, as shown in the image below (Image source: https://www.researchgate.net/figure/Cross-sectional-view-of-a-typical-MOSFET_fig1_257554344).

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_2.png" alt="Pchannel mosfet" style="max-width:100%; height:auto;">
</p>

### Functioning of MOSFETs
In the N-channel case, when a positive voltage is applied to the gate (relative to the source), it creates an electric field across the oxide. This field repels holes in the P-type substrate and attracts electrons toward the surface, forming a thin **inversion layer** of N-type carriers under the oxide. **This induced channel allows current to flow between the source and drain when a voltage is applied.**

### Operating Regions of MOSFETs
According to the value of the gate-source voltage and the drain-source voltage, the MOSFET can operate in three different regimes.

- The first regime is the **Cutoff Region (OFF).** In this region, the voltage between gate and source is not sufficiently positive (for N-MOS) or negative (for P-MOS) to accumulate the correct type of charges below the oxide layer. As a result, no conductive channel is formed, and the MOSFET remains off.

- The second regime is the **Linear / Ohmic Region.** Here, the gate-source voltage is high enough to induce a conductive channel beneath the gate, and the drain-source voltage is low enough that this channel remains uniform along its length. The MOSFET behaves like a **voltage-controlled resistor**, where the resistance depends on the value of the gate-source voltage.

- The third regime is the **Saturation Region.** In this case, the drain-source voltage is sufficiently high that the channel becomes **pinched off** near the drain. While current still flows due to carrier drift, the channel's resistance increases and current becomes mostly controlled by the gate-source voltage. This region is typically used when the MOSFET operates as a current source rather than a switch.

 ### Driving circuit for N-channel MOSFET and P-Channel Mosfets
Given their different characteristics, the two types of MOSFETs are better suited for different roles. When using a MOSFET as a low-resistance switch, the **N-channel MOSFET** is generally preferred for **low-side switching**, while the **P-channel MOSFET** is more suitable for **high-side switching**.

In the examples below, we will examine two typical circuits to understand why each type is used in its respective position.

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_3.png" alt="Pchannel mosfet" style="max-width:80%; height:auto;">
</p>

In the N-channel case (left image), we see that the MOSFET is placed **after the load**, with respect to the supply voltage. In this configuration, when the **gate is pulled to ground (0V)**, the MOSFET is switched **off**. To power the load, we **close the switch**, bringing the gate to **V+**, which creates a positive gate-source voltage and brings the MOSFET into the **linear (ON) region**.

If we were to place the **load after the MOSFET** instead, then—when turning the MOSFET on—the current flowing through the load would quickly cause a **voltage drop**, raising the **source voltage toward V+**. This would reduce the **gate-source voltage (V_GS)** to zero, effectively **turning the MOSFET off** again. This feedback makes such a configuration unstable or non-functional for low-side switching.

In the P-channel case (right image), the MOSFET is placed **before the load**, connected between the **positive supply (V+) and the load**— a typical **high-side switch** configuration. In this setup, the **gate is continuously pulled low** (e.g., to ground), keeping the gate-source voltage negative and the MOSFET **turned on** by default.

To **turn it off**, we bring the gate **up to V+**, making the **gate-source voltage zero**. Without a negative gate-source voltage, no conductive channel is formed and the MOSFET switches off, disconnecting the load.

If we tried placing the P-channel MOSFET **after the load**, the source would no longer sit at a fixed high potential (V+), and pulling the gate low wouldn’t guarantee the required negative gate-source voltage. This would result in unstable or non-functional switching, confirming why P-MOSFETs are best suited for high-side placement.

### Driving MOSFET Gates with a Low-Voltage Microcontroller

MOSFET gates often require higher voltages than what low-power microcontrollers like Arduino or ESP32 can provide, especially for fast switching in motor control applications. To bridge this gap, additional driving circuitry is needed. Ideally, gate drivers or other MOSFETs would be used to achieve fast transitions and minimize losses. However, in my experimental setup, only BJT transistors were available, so I implemented a simple BJT-based gate driving circuit depicted below.

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_4.png" alt="bjt gate driver" style="max-width:50%; height:auto;">
</p>

With this simple circuit the BJT acts as a level shifter, and enables to use the 5V of arduino to control the 12V of the power supply which drives the Mosfets’ gates.

## Driving BLDC Motors: Three-Phase Switching with MOSFETs

Brushless DC (BLDC) motors operate using direct current but rely on electronic rather than mechanical commutation. Instead of brushes, they use external circuitry to switch current through the stator windings in a sequence that generates a rotating magnetic field. The rotor, equipped with permanent magnets, aligns with this field to produce motion. This architecture improves efficiency and eliminates brush wear, reducing maintenance. However, it also introduces the need for precise position sensing and more sophisticated control electronics to manage commutation.

At the core of this switching system is a triple Half-bridge circuit, typically built using MOSFETs.

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_5.png" alt="Triple half bridge" style="max-width:50%; height:auto;">
</p>

A triple half-bridge configuration is shown in the image above. Each of the three motor phases (A, B, and C) is driven by a half-bridge composed of two MOSFETs. In this circuit, the high-side switching is performed using P-channel MOSFETs, while the low-side switching uses N-channel MOSFETs. This design choice is due to the use of the W342 package, which integrates one N-channel and one P-channel MOSFET. A more detailed explanation of high-side and low-side switching can be found in the section on basic MOSFET driving circuits.

### Basic Commutation Sequence - 6 steps

The simplest method for driving a BLDC motor is the six-step commutation technique. This approach involves energizing two of the three motor phases at a time, while the third phase remains unpowered (floating). By advancing this sequence in sync with the rotor's position, the motor can be driven effectively.

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_6.png" alt="BLDC motor commutation" style="max-width:80%; height:auto;">
</p>

As shown in the left image, a simplified model of a BLDC motor is presented. The right image illustrates the six-step commutation sequence. In each sector, two phases are activated: one to attract and the other to repel the rotor's permanent magnets, generating torque. Accurate sector switching requires real-time monitoring of the rotor position. (Images source: https://it.mathworks.com/help/mcb/ref/sixstepcommutation.html)

<div align="center">

<table style="border-collapse: collapse; text-align: center;">
  <tr>
    <th style="border: 1px solid black; padding: 8px;"><strong>Sector</strong></th>
    <th style="border: 1px solid black; padding: 8px;">1</th>
    <th style="border: 1px solid black; padding: 8px;">2</th>
    <th style="border: 1px solid black; padding: 8px;">3</th>
    <th style="border: 1px solid black; padding: 8px;">4</th>
    <th style="border: 1px solid black; padding: 8px;">5</th>
    <th style="border: 1px solid black; padding: 8px;">6</th>
  </tr>
  <tr>
    <td style="border: 1px solid black; padding: 8px;"><strong>High-Side Phase</strong></td>
    <td style="border: 1px solid black; padding: 8px;">B</td>
    <td style="border: 1px solid black; padding: 8px;">B</td>
    <td style="border: 1px solid black; padding: 8px;">C</td>
    <td style="border: 1px solid black; padding: 8px;">C</td>
    <td style="border: 1px solid black; padding: 8px;">A</td>
    <td style="border: 1px solid black; padding: 8px;">A</td>
  </tr>
  <tr>
    <td style="border: 1px solid black; padding: 8px;"><strong>Low-Side Phase</strong></td>
    <td style="border: 1px solid black; padding: 8px;">C</td>
    <td style="border: 1px solid black; padding: 8px;">A</td>
    <td style="border: 1px solid black; padding: 8px;">A</td>
    <td style="border: 1px solid black; padding: 8px;">B</td>
    <td style="border: 1px solid black; padding: 8px;">B</td>
    <td style="border: 1px solid black; padding: 8px;">C</td>
  </tr>
</table>

</div>
<p> </p>

While the simplified model shown above features only two magnetic poles and three phases nodes, there exists motors with more poles and nodes than that. For example the motor that I will be using for experiments has a combination of **12 nodes** and **14 poles.** In this case in order to complete a full mechancial rotation the sequence of six steps must be repeated **7 times** one time for each pole pair.

To ensure that motor commutation occurs at the correct moment, the **rotor's angular position** must be known. For this purpose, a **rotary encoder** is used.

In a BLDC motor, one **electrical cycle** consists of **6 commutation steps** (due to the three-phase structure). The number of **electrical cycles per mechanical revolution** is equal to the number of **pole pairs** of the motor. In this case, the motor has **14 poles**, or **7 pole pairs**, meaning there are **7 electrical cycles** in one full mechanical rotation.

Therefore, the total number of commutation steps per mechanical revolution is:

$$
6 \text{ steps/cycle} \times 7 \text{ cycles/rev} = 42 \text{ steps/rev}
$$

This allows us to divide the full $360^\circ$ mechanical rotation into **42 equal sectors**. The control logic can then advance to the next commutation state after every:

$$
\frac{360^\circ}{42} = 8.57^\circ
$$

of mechanical rotation, using the encoder to track this angular movement.


### Prototype and Code implementation
The main characteristics of the circuit have been detailed in earlier sections. The microcontroller used to drive the BJTs— which in turn switch the MOSFET gates—is an **Arduino UNO**. Six digital pins are used to control the triple half-bridge, one for each MOSFET.

The **AS5600** magnetic rotary encoder is used for position feedback. It communicates via **I²C**, but since it operates at **3.3V**, different from Arudino's **5V**, proper functioning requires **pull-up resistors** on the SDA and SCL lines. Without these resistors, communication will not be reliable.

<p align="center">
  <img src="/img/research/research_assets_bldcstudy/bldc_img_7.png" alt="Arduino bldc driver" style="max-width:80%; height:auto;">
<p>

The code, reported below, sets up a **BLDC motor control loop** using rotor position feedback. After initializing the encoder and setting up the I/O pins, the system captures a **zero reference angle** for the motor. In the main loop, it continuously reads the current rotor angle, calculates how far the rotor has turned since the zero position, and determines which of the six **commutation states** to apply based on this angle.
If the rotor has moved into a new commutation sector, the corresponding state is applied by activating the correct high-side and low-side transistors through a predefined **commutation table**. To ensure safe switching, all transistors are briefly turned off before applying the new state. This loop runs continuously, ensuring that the motor is driven according to its actual angular position.


```cpp
#include "AS5600.h"
#include <Wire.h>

// === Pin Assignments ===
#define A_HIGH 4
#define B_HIGH 3
#define C_HIGH 2
#define A_LOW  7
#define B_LOW  6
#define C_LOW  5



// === Encoder Setup ===
AS5600 as5600;
float zero_offset = 0;

// === Commutation Parameters ===
const float DEG_PER_STEP = 360.0 / (6 * 7);  // ≈ 8.57°
uint8_t step = 0;

// === Full 6-Step Commutation Table ===
// Each row: {A_H, A_L, B_H, B_L, C_H, C_L}
const uint8_t commutation_table[6][6] = {
  {1, 0, 0, 0, 0, 1},  // Step 0: A+ C-
  {0, 0, 1, 0, 0, 1},  // Step 1: B+ C-
  {0, 1, 1, 0, 0, 0},  // Step 2: B+ A-
  {0, 1, 0, 0, 1, 0},  // Step 3: C+ A-
  {0, 0, 0, 1, 1, 0},  // Step 4: C+ B-
  {1, 0, 0, 1, 0, 0}   // Step 5: A+ B-
};

void setup() {
  Serial.begin(115200);
  Wire.begin();

  as5600.begin(12);
  as5600.setDirection(AS5600_CLOCK_WISE);
  delay(500);

  pinMode(A_HIGH, OUTPUT); pinMode(A_LOW, OUTPUT);
  pinMode(B_HIGH, OUTPUT); pinMode(B_LOW, OUTPUT);
  pinMode(C_HIGH, OUTPUT); pinMode(C_LOW, OUTPUT);

  // === ALIGN ===
  //applyStep(0);  // A+ C-
  delay(1000);
  zero_offset = as5600.readAngle() * AS5600_RAW_TO_DEGREES;
  Serial.println("Encoder zeroed");
}

void loop() {
  float angle = as5600.readAngle() * AS5600_RAW_TO_DEGREES - zero_offset;
  if (angle < 0) angle += 360;

  uint8_t new_step = ((6 - ((uint8_t)(angle / DEG_PER_STEP)) % 6)) % 6;
  delay(1);

  if (new_step != step) {
    step = new_step;
    applyStep(step);
    Serial.print("Step: "); Serial.print(step);
    Serial.print("\tAngle: "); Serial.println(angle, 2);
  }
}

void applyStep(uint8_t s) {
  // 1. Turn all OFF first
  digitalWrite(A_HIGH, LOW);  // P-MOS off = BC337 off
  digitalWrite(B_HIGH, LOW);
  digitalWrite(C_HIGH, LOW);
  digitalWrite(A_LOW,  HIGH); // N-MOS off = BC337 on
  digitalWrite(B_LOW,  HIGH);
  digitalWrite(C_LOW,  HIGH);

  delayMicroseconds(100);  // 100 µs dead time

  // 2. Apply new step safely
  const uint8_t *pins = commutation_table[s];

  // High-side (P-MOS) — inverted logic
  digitalWrite(A_HIGH, pins[0]);
  digitalWrite(B_HIGH, pins[2]);
  digitalWrite(C_HIGH, pins[4]);

  // Low-side (N-MOS) — normal logic
  digitalWrite(A_LOW,  !pins[1]);
  digitalWrite(B_LOW,  !pins[3]);
  digitalWrite(C_LOW,  !pins[5]);
}
```
<p> </p>

### Demonstration
<p> </p>
<div style="display: flex; gap: 20px; justify-content: center; align-items: center; flex-wrap: wrap;">
  <video controls muted playsinline disablePictureInPicture controlsList="nodownload noremoteplayback nofullscreen"
         style="max-width: 100%; width: 480px; height: auto;">
    <source src="/img/research/research_assets_bldcstudy/video1.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

  <video controls muted playsinline disablePictureInPicture controlsList="nodownload noremoteplayback nofullscreen"
         style="max-width: 100%; width: 480px; height: auto;">
    <source src="/img/research/research_assets_bldcstudy/video2.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>


