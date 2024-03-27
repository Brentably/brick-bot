import React from 'react';
import styled, { keyframes } from 'styled-components';
import Image from 'next/image'
import bricks from "../public/assets/bricks.svg"


const LoadingBrick = () => {
  return (
      <div className='flex justify-center items-center animate-bounce'>
        <img src={bricks.src} alt='' className='' />
      </div>
  );
};

export default LoadingBrick;