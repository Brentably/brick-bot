import React from 'react';
import styled, { keyframes } from 'styled-components';
import Image from 'next/image'
import bricks from "../public/assets/bricks.svg"


const LoadingBrick = ({ className = '' }) => {
  return (
      <div className={`flex justify-center items-center animate-bounce ${className}`}>
        <Image src={bricks} alt='' />
      </div>
  );
};
export default LoadingBrick;