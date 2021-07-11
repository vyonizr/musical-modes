import React from 'react'
import styles from '../styles/Slider.module.css'

interface IProps {
  name: string
  isChecked: boolean
  onClick: () => void
}

const Slider = ({ name, isChecked, onClick }: IProps) => {
  return (
    <label className={styles.switch}>
      <input name={name} type='checkbox' checked={isChecked} readOnly />
      <span className={`${styles.slider} ${styles.round}`} onClick={onClick} />
    </label>
  )
}

export default Slider
