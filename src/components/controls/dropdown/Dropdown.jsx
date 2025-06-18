import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import './Dropdown.scss';

const Dropdown = ({
                    label = null,
                    disabled,
                    items,
                    onSelect,
                    selectedItems = [],
                    placeholder = 'Select options',
                    multiSelect = false,
                    show_selected_descriptions = false
                  }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex !== -1) {
          toggleItem(items[focusedIndex]);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
    }
  };

  const toggleItem = (item) => {
    onSelect(item);
  };

  const selectSingleItem = (item) => {
    onSelect(item);
    setIsOpen(false);
  };

  const handleItemAction = (item) => {
    if (multiSelect) {
      toggleItem(item);
    } else {
      selectSingleItem(item);
    }
  };

  const display_descriptions = (selectedItems) => {
    let description = '';
    for (let i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i].description) {
        description += selectedItems[i].description
      }
    }
    return description
  }

  const selectedLabels = selectedItems.map(item => item && item.label).join(', ');

  return (
    <div className={disabled? "Dropdown _disabled" : "Dropdown"} ref={dropdownRef}>
      <div className={"__label"}>{label? label : placeholder}</div>
      <div
        className={disabled? "__trigger _disabled" : "__trigger"}
        tabIndex={0}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <div className={disabled? "__selected-items _disabled" : "__selected-items"}>
          {selectedItems.length > 0 ? selectedLabels : placeholder}
        </div>
        <span className={`__arrow ${isOpen ? 'open' : ''}`}>▾</span>
      </div>

      {isOpen && (
        <ul className={disabled? "__menu _disabled" : "__menu"} role="listbox">
          {items.map((item, index) => {
            const isSelected = selectedItems.some(selected => selected.value === item.value);
            return (
              <li
                key={item.value}
                role="option"
                aria-selected={isSelected}
                className={`__item ${index === focusedIndex ? 'focused' : ''}`}
                onClick={() => handleItemAction(item)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {multiSelect && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="checkbox"
                  />
                )}
                {item.label}
              </li>
            );
          })}
          {items.length === 0 && <li className="__item _disabled">No options available</li>}
        </ul>
      )}
      <div className={"__description"}>
        {show_selected_descriptions && display_descriptions(selectedItems)}
      </div>
    </div>
  );
};

export default Dropdown;