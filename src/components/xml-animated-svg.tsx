"use client"

import * as React from "react"
import { motion } from "motion/react"

interface XmlAnimatedSvgProps {
  isDragging?: boolean
  isDropping?: boolean
  className?: string
}

export function XmlAnimatedSvg({
  isDragging = false,
  isDropping = false,
  className,
}: XmlAnimatedSvgProps) {
  return (
    <svg
      width="182"
      height="163"
      viewBox="0 0 182 163"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id="filter0_d_44_138" x="1.66893e-06" y="15.8405" width="140.405" height="146.27" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="3.58904"/>
          <feGaussianBlur stdDeviation="1.79452"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>

        <filter id="filter1_d_44_138" x="47.4483" y="14.6605" width="63.0001" height="43.6922" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1.79452"/>
          <feGaussianBlur stdDeviation="1.52534"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="luminosity" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>

        <filter id="filter2_d_44_138" x="63.7981" y="15.5248" width="110.333" height="140.461" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="3.22293"/>
          <feGaussianBlur stdDeviation="1.61146"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>

        <filter id="filter3_d_44_138" x="131.737" y="25.8642" width="41.911" height="53.6494" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1.61146"/>
          <feGaussianBlur stdDeviation="1.36974"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="luminosity" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>

        <filter id="filter4_d_44_138" x="36.4956" y="8" width="116" height="154" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>

        <filter id="filter5_d_44_138" x="95.5956" y="6.6" width="56.3" height="54.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="2"/>
          <feGaussianBlur stdDeviation="1.7"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="luminosity" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>

        <filter id="filter6_d_44_138" x="48.4956" y="92" width="41" height="30" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_44_138"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_44_138" result="shape"/>
        </filter>
      </defs>

      {/* ============================================================ */}
      {/* 1. DOCUMENTO ESQUERDO (Expande p/ esquerda no drag over)      */}
      {/* ============================================================ */}
      <motion.g
        initial={false}
        animate={
          isDropping
            ? { x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.95 }
            : isDragging
            ? { x: -34, y: -6, rotate: -16, opacity: 1, scale: 1.02 }
            : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        style={{ transformOrigin: "60px 100px" }}
      >
        <g filter="url(#filter0_d_44_138)">
          <path
            d="M55.1432 154.454L132.208 124.871C135.909 123.451 137.758 119.299 136.337 115.598L107.398 40.2079C87.4617 31.3461 70.6335 24.7024 50.6974 15.8405L8.19473 32.1558C4.49369 33.5765 2.64735 37.7276 4.06804 41.4286L45.8695 150.325C47.2901 154.026 51.4421 155.875 55.1432 154.454Z"
            fill="white"
          />
        </g>
        <g filter="url(#filter1_d_44_138)">
          <path
            d="M50.499 15.9167L107.398 40.2079L74.31 52.9091C69.6837 54.685 64.4938 52.3742 62.7179 47.7479L50.499 15.9167Z"
            fill="#FFFEFE"
          />
        </g>
        <path d="M13.0202 44.7199L49.8774 30.5717" stroke="#E3E3E3" strokeWidth="1.79452" strokeLinecap="round"/>
        <path d="M15.9141 52.2589L30.9921 46.471" stroke="#E3E3E3" strokeWidth="1.79452" strokeLinecap="round"/>
      </motion.g>

      {/* ============================================================ */}
      {/* 2. DOCUMENTO DIREITO (Expande p/ direita no drag over)        */}
      {/* ============================================================ */}
      <motion.g
        initial={false}
        animate={
          isDropping
            ? { x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.95 }
            : isDragging
            ? { x: 34, y: -6, rotate: 16, opacity: 1, scale: 1.02 }
            : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        style={{ transformOrigin: "120px 100px" }}
      >
        <g filter="url(#filter2_d_44_138)">
          <path
            d="M71.6918 128.857L142.948 149.289C146.37 150.27 149.939 148.291 150.92 144.869L170.909 75.1627C161.4 58.0333 152.922 44.1742 143.414 27.0449L104.115 15.7761C100.693 14.7949 97.1253 16.7741 96.144 20.1962L67.2724 120.884C66.2911 124.306 68.2698 127.875 71.6918 128.857Z"
            fill="white"
          />
        </g>
        <g filter="url(#filter3_d_44_138)">
          <path
            d="M143.23 26.9922L170.909 75.1626L140.315 66.3901C136.037 65.1635 133.564 60.7015 134.791 56.424L143.23 26.9922Z"
            fill="#FFFEFE"
          />
        </g>
        <path d="M100.786 27.3945L134.864 37.1665" stroke="#E3E3E3" strokeWidth="1.61146" strokeLinecap="round"/>
        <path d="M98.7868 34.3652L112.728 38.3628" stroke="#E3E3E3" strokeWidth="1.61146" strokeLinecap="round"/>
      </motion.g>

      {/* ============================================================ */}
      {/* 3. DOCUMENTO CENTRAL (Recebe os outros dois ao soltar)        */}
      {/* ============================================================ */}
      <motion.g
        initial={false}
        animate={
          isDropping
            ? { scale: 1, y: 0 }
            : isDragging
            ? { scale: 1.08, y: -4 }
            : { scale: 1, y: 0 }
        }
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        style={{ transformOrigin: "94px 80px" }}
      >
        <g filter="url(#filter4_d_44_138)">
          <path
            d="M48.4956 154H140.496C144.914 154 148.496 150.418 148.496 146V56C131.292 38.8169 116.436 25.1831 99.2325 8H48.493C44.0747 8 40.4956 11.5817 40.4956 16V146C40.4956 150.418 44.0774 154 48.4956 154Z"
            fill="white"
          />
        </g>
        <g filter="url(#filter5_d_44_138)">
          <path
            d="M98.9956 8L148.496 56H108.996C103.473 56 98.9956 51.5228 98.9956 46V8Z"
            fill="#FFFEFE"
          />
        </g>

        {/* Matriz verde fiscal */}
        <path d="M123.496 123.625C123.496 127.698 120.194 131 116.121 131H93.9956V116.25H123.496V123.625Z" fill="#DCFCE7"/>
        <path d="M123.496 116.25H93.9956V101.5H123.496V116.25Z" fill="#86EFAC"/>
        <path d="M93.9956 116.25H64.4956V101.5H93.9956V116.25Z" fill="#4ADE80"/>
        <path d="M123.496 101.5H93.9956V86.75H123.496V101.5Z" fill="#22C55E"/>
        <path d="M93.9956 101.5H64.4956V86.75H93.9956V101.5Z" fill="#16A34A"/>
        <path d="M123.496 86.75H93.9956V72H116.121C120.194 72 123.496 75.3019 123.496 79.375V86.75Z" fill="#15803D"/>
        <path d="M93.9956 86.75H64.4956V79.375C64.4956 75.3019 67.7975 72 71.8706 72H93.9956V86.75Z" fill="#166534"/>
        <path d="M93.9956 131H71.8706C67.7975 131 64.4956 127.698 64.4956 123.625V116.25H93.9956V131Z" fill="#BBF7D0"/>

        {/* Badge XML */}
        <g filter="url(#filter6_d_44_138)">
          <rect x="52.4956" y="92" width="33" height="22" rx="5" fill="white" shapeRendering="crispEdges"/>
          <path d="M58.8969 107.692L57.8785 106.642C58.1501 106.305 58.5004 105.889 58.9295 105.395C59.3586 104.901 59.8175 104.385 60.3063 103.847C59.8175 103.331 59.3586 102.856 58.9295 102.421C58.5004 101.987 58.1528 101.637 57.8867 101.37L58.9376 100.377C59.1929 100.626 59.5269 100.966 59.9397 101.395C60.3579 101.824 60.8033 102.294 61.2758 102.804C61.7103 102.348 62.1339 101.914 62.5467 101.501C62.9649 101.088 63.3451 100.735 63.6873 100.442L64.7057 101.468C64.3689 101.756 63.9887 102.106 63.5651 102.519C63.1414 102.932 62.7042 103.372 62.2534 103.839C62.7368 104.355 63.1985 104.857 63.6384 105.346C64.0838 105.835 64.4612 106.259 64.7708 106.617L63.6466 107.66C63.3533 107.263 62.9975 106.823 62.5793 106.34C62.1665 105.857 61.732 105.371 61.2758 104.882C60.7979 105.398 60.3498 105.903 59.9316 106.397C59.5134 106.886 59.1685 107.318 58.8969 107.692ZM65.5004 107.595C65.4841 107.057 65.4759 106.541 65.4759 106.047C65.4759 105.156 65.5031 104.35 65.5574 103.627C65.6117 102.905 65.6904 102.291 65.7936 101.786C65.8425 101.552 65.9104 101.327 65.9973 101.11C66.0896 100.893 66.2173 100.716 66.3802 100.58C66.5486 100.439 66.7686 100.368 67.0401 100.368C67.3063 100.368 67.5316 100.439 67.7163 100.58C67.901 100.716 68.0503 100.882 68.1644 101.077C68.2839 101.273 68.3708 101.46 68.4251 101.639C68.5663 102.063 68.6858 102.487 68.7836 102.91C68.8813 103.334 68.9682 103.739 69.0443 104.124C69.0986 103.842 69.161 103.546 69.2316 103.236C69.3022 102.921 69.3728 102.625 69.4435 102.348C69.5141 102.066 69.5792 101.832 69.639 101.647C69.916 100.795 70.3423 100.368 70.918 100.368C71.2385 100.368 71.5101 100.485 71.7327 100.719C71.9554 100.947 72.1184 101.278 72.2215 101.713C72.2704 101.908 72.3193 102.193 72.3682 102.568C72.4225 102.943 72.4714 103.388 72.5148 103.904C72.5637 104.415 72.6045 104.98 72.637 105.599C72.6751 106.218 72.7049 106.875 72.7267 107.57L71.2928 107.538C71.2928 107.25 71.2847 106.916 71.2684 106.536C71.2575 106.155 71.2385 105.762 71.2113 105.354C71.1896 104.942 71.1625 104.54 71.1299 104.149C71.1027 103.758 71.0728 103.405 71.0402 103.089C71.0131 102.774 70.9859 102.525 70.9588 102.34C70.9316 102.15 70.9072 102.055 70.8855 102.055C70.88 102.055 70.8502 102.153 70.7958 102.348C70.747 102.538 70.6845 102.793 70.6085 103.114C70.5379 103.434 70.4591 103.787 70.3722 104.173C70.2853 104.559 70.1984 104.947 70.1115 105.338C70.03 105.724 69.9567 106.082 69.8915 106.413C69.8264 106.739 69.7748 107.005 69.7367 107.212L68.4577 107.244C68.3925 106.94 68.3138 106.606 68.2214 106.242C68.1345 105.873 68.0422 105.498 67.9444 105.118C67.8521 104.732 67.7598 104.363 67.6674 104.01C67.5751 103.652 67.4882 103.331 67.4067 103.049C67.3307 102.766 67.2682 102.544 67.2194 102.381C67.1705 102.212 67.1406 102.128 67.1297 102.128C67.108 102.128 67.0836 102.248 67.0564 102.487C67.0347 102.72 67.013 103.038 66.9912 103.44C66.9695 103.842 66.9505 104.295 66.9342 104.8C66.9233 105.305 66.9179 105.827 66.9179 106.365C66.9179 106.62 66.9179 106.853 66.9179 107.065C66.9233 107.277 66.9288 107.451 66.9342 107.587L65.5004 107.595ZM76.0624 107.595C75.5247 107.595 75.0983 107.549 74.7833 107.456C74.4683 107.364 74.2347 107.234 74.0827 107.065C73.9306 106.902 73.8301 106.709 73.7812 106.487C73.7378 106.259 73.7161 106.014 73.7161 105.754C73.7161 105.319 73.7269 104.822 73.7486 104.263C73.7758 103.703 73.8084 103.103 73.8464 102.462C73.8899 101.816 73.936 101.148 73.9849 100.458L75.4676 100.605C75.4133 101.023 75.3644 101.452 75.321 101.892C75.283 102.326 75.2504 102.75 75.2232 103.163C75.1961 103.576 75.1744 103.95 75.1581 104.287C75.1418 104.624 75.1282 104.906 75.1173 105.134C75.1119 105.357 75.1092 105.501 75.1092 105.566C75.1092 105.756 75.1309 105.9 75.1744 105.998C75.2178 106.09 75.3047 106.153 75.4351 106.185C75.5654 106.218 75.7555 106.234 76.0053 106.234C76.3204 106.234 76.6761 106.215 77.0726 106.177C77.4691 106.134 77.871 106.071 78.2783 105.99C78.6857 105.908 79.0577 105.811 79.3944 105.696L79.7122 107.098C79.3429 107.19 78.9437 107.274 78.5146 107.35C78.0909 107.426 77.6673 107.486 77.2437 107.53C76.82 107.573 76.4263 107.595 76.0624 107.595Z" fill="black"/>
        </g>

        <path d="M48.4956 23H92.4956" stroke="#E3E3E3" strokeWidth="2" strokeLinecap="round"/>
        <path d="M48.4956 32H66.4956" stroke="#E3E3E3" strokeWidth="2" strokeLinecap="round"/>
      </motion.g>
    </svg>
  )
}
