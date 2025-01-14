import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Check, ChevronDown } from 'lucide-react-native';
import React from 'react';
import { GestureResponderEvent, Text, View, ViewStyle } from 'react-native';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import { Button, buttonTextVariants } from './button';

const SELECT_ITEM_HEIGHT = 50;

interface SelectData {
  value: string;
  label: string;
}

interface SelectProps {
  items: SelectData[];
  defaultValue?: SelectData;
  onValueChange?: (value: SelectData | null) => void;
}
interface SelectContext {
  items: SelectData[];
  selected: SelectData | null;
  setSelected: React.Dispatch<React.SetStateAction<SelectData | null>>;
  onValueChange?: (value: SelectData | null) => void;
}

const SelectContext = React.createContext<SelectContext>({} as SelectContext);

const Select = React.forwardRef<
  React.ElementRef<typeof Popover>,
  React.ComponentPropsWithoutRef<typeof Popover> & SelectProps
>(({ onValueChange, defaultValue = null, items, ...props }, ref) => {
  const [selected, setSelected] = React.useState<SelectData | null>(
    defaultValue
  );
  return (
    <SelectContext.Provider
      value={{
        items,
        selected,
        setSelected,
        onValueChange,
      }}
    >
      <Popover ref={ref} {...props} />
    </SelectContext.Provider>
  );
});

Select.displayName = 'Select';

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error(
      'Select compound components cannot be rendered outside the Select component'
    );
  }
  return context;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  Omit<React.ComponentPropsWithoutRef<typeof PopoverTrigger>, 'children'> & {
    placeholder: string;
  }
>(({ variant = 'outline', placeholder = 'Select...', ...props }, ref) => {
  const { selected } = useSelectContext();
  return (
    <PopoverTrigger ref={ref} variant='outline' {...props}>
      {({ pressed }) => (
        <View className='flex-1 flex-row justify-between items-center'>
          <Text
            className={buttonTextVariants({
              variant: 'outline',
              className: cn(
                !selected?.value && 'opacity-90',
                pressed && 'opacity-70'
              ),
            })}
          >
            {selected?.value ?? placeholder}
          </Text>
          <ChevronDown
            className={buttonTextVariants({
              variant: 'outline',
              className: 'opacity-70',
            })}
          />
        </View>
      )}
    </PopoverTrigger>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

const SelectList = React.forwardRef<
  React.ElementRef<typeof FlashList<SelectData>>,
  Omit<
    React.ComponentPropsWithoutRef<typeof FlashList<SelectData>>,
    'data' | 'estimatedItemSize' | 'initialScrollIndex'
  > & {
    containerProps?: React.ComponentPropsWithoutRef<typeof PopoverContent>;
  }
>(({ containerProps, extraData, ...props }, ref) => {
  const { selected, items } = useSelectContext();

  const initialScrollIndex = React.useMemo(() => {
    return selected
      ? items.findIndex((item) => item.value === selected.value)
      : undefined;
  }, [selected, items]);

  return (
    <PopoverContent
      style={{ height: items.length * SELECT_ITEM_HEIGHT + 12 }}
      className='p-0 max-h-[30%]'
      {...containerProps}
    >
      <FlashList<SelectData>
        ref={ref}
        data={items}
        contentContainerStyle={{ padding: 8 }}
        estimatedItemSize={SELECT_ITEM_HEIGHT}
        initialScrollIndex={initialScrollIndex}
        extraData={[selected, extraData]}
        {...props}
      />
    </PopoverContent>
  );
});

SelectList.displayName = 'SelectList';

type RenderSelectItem = ListRenderItem<SelectData>;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof PopoverClose>,
  Omit<
    React.ComponentPropsWithoutRef<typeof PopoverClose>,
    'children' | 'style' | 'asChild'
  > & {
    index: number;
    item: SelectData;
    style?: ViewStyle;
  }
>(
  (
    { variant = 'outline', index, item, onPress, style, className, ...props },
    ref
  ) => {
    const { selected, setSelected, onValueChange } = useSelectContext();

    function handleOnPress(ev: GestureResponderEvent) {
      onPress?.(ev);
      setSelected((prev) => {
        if (prev?.value === item.value) {
          onValueChange?.(null);
          return null;
        }
        onValueChange?.(item);
        return item;
      });
    }
    return (
      <PopoverClose asChild style={[{ height: SELECT_ITEM_HEIGHT }, style]}>
        <Button
          ref={ref}
          variant={'ghost'}
          className={cn(
            index === 0 ? '' : 'border-t border-border',
            'justify-start gap-3 pl-3',
            className
          )}
          onPress={handleOnPress}
          {...props}
        >
          {({ pressed }) => (
            <>
              <View>
                <Check
                  className={cn(
                    'text-primary',
                    buttonTextVariants({
                      variant: 'ghost',
                      className: selected === item ? '' : 'opacity-0',
                    })
                  )}
                />
              </View>
              <Text
                className={buttonTextVariants({
                  variant: 'ghost',
                  className: pressed ? 'opacity-70' : '',
                })}
              >
                {item.label}
              </Text>
            </>
          )}
        </Button>
      </PopoverClose>
    );
  }
);

SelectItem.displayName = 'SelectItem';

export {
  Select,
  SelectTrigger,
  SelectList,
  SelectItem,
  type RenderSelectItem,
  type SelectData,
};
