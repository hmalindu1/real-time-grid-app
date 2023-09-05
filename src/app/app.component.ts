import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { DATA } from './data';


interface DataType {
  [key: string]: string | number;
  make: string;
  model: string;
  price: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  data: DataType[] = DATA;
  searchInput = new FormControl();
  private dataSubject = new BehaviorSubject<DataType[]>(this.data);
  sortedData: Observable<DataType[]>;
  currentSortDirection: 'asc' | 'desc' | null = null;
  currentSortAttribute: string | null = null;

  // Pagination variables
  pageSize = 10;
  currentPage = 0;
  totalPages = Math.ceil(this.data.length / this.pageSize);

  constructor() {
    this.sortedData = this.dataSubject
      .asObservable()
      .pipe(
        map((data) =>
          data.slice(
            this.currentPage * this.pageSize,
            (this.currentPage + 1) * this.pageSize
          )
        )
      );

    this.searchInput.valueChanges
      .pipe(
        debounceTime(300), // Wait for 300ms pause in events
        distinctUntilChanged() // Only emit if value is different from previous value
      )
      .subscribe((text) => {
        const filteredData = this.searchData(text);
        this.dataSubject.next(filteredData);
      });
  }

  /**
   * Searches the data for items matching the given text.
   *
   * @param text The text to search for.
   * @returns An array of matching items.
   */
  private searchData(text: string): DataType[] {
    let filteredData = this.data;

    if (text) {
      filteredData = this.data.filter((item) => {
        // Check string attributes (make and model)
        if (
          item.make.toLowerCase().includes(text.toLowerCase()) ||
          item.model.toLowerCase().includes(text.toLowerCase())
        ) {
          return true;
        }
        // Check numeric attributes (price)
        if (item.price.toString().includes(text)) {
          return true;
        }
        return false;
      });
    }

    // Calculate totalPages based on filtered data
    this.totalPages = Math.ceil(filteredData.length / this.pageSize);

    return filteredData; // Return the entire filtered data without slicing
  }

  /**
   * Moves to the next page of data.
   */
  nextPage() {
    // Check if there are more pages to navigate to
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++; // Increment the current page
      this.updateDisplayedData(); // Update the displayed data
    }
  }

  /**
   * Go to the previous page in the pagination.
   */
  previousPage() {
    // Check if the current page is greater than 0
    if (this.currentPage > 0) {
      // Decrement the current page
      this.currentPage--;

      // Update the displayed data
      this.updateDisplayedData();
    }
  }

/**
 * Function to handle jump to page event
 * @param event - The event object
 */
jumpToPage(event: Event) {
  // Cast the event target to HTMLSelectElement
  const selectElement = event.target as HTMLSelectElement;
  
  // Get the selected page number from the value of the select element
  const selectedPage = Number(selectElement.value);
  
  // Check if the selected page number is within the valid range
  if (selectedPage >= 0 && selectedPage < this.totalPages) {
    // Update the current page number
    this.currentPage = selectedPage;
    
    // Update the displayed data
    this.updateDisplayedData();
  }
}

  /**
   * Update the displayed data based on the search input value.
   */
  private updateDisplayedData() {
    // Filter the data based on the search input value
    const filteredData = this.searchData(this.searchInput.value);

    // Update the data subject with the filtered data
    this.dataSubject.next(filteredData);
  }

  /**
   * Sorts the data based on the given sort attribute.
   * If the sort attribute is the same as the current sort attribute,
   * it toggles the sort order. Otherwise, it sets the new sort attribute
   * and sets the sort order to ascending.
   *
   * @param sortAttribute - The attribute to sort the data by.
   */
  sortData(sortAttribute: string) {
    // Create a new array copy based on displayed data
    const sortedArray = [...this.dataSubject.value];

    // Check if we are toggling the sort order or setting a new sort attribute
    if (this.currentSortAttribute === sortAttribute) {
      // Toggle the sort order
      this.currentSortDirection =
        this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set the new sort attribute and sort order to ascending
      this.currentSortAttribute = sortAttribute;
      this.currentSortDirection = 'asc';
    }

    // Sort the array based on the sort attribute and sort direction
    sortedArray.sort((a, b) => {
      const valueA = a[sortAttribute];
      const valueB = b[sortAttribute];

      let comparison = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      }

      return this.currentSortDirection === 'desc' ? -comparison : comparison;
    });

    // Update the displayed data with the sorted array
    this.dataSubject.next(sortedArray);
  }
}
