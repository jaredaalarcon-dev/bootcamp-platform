// src/components/courses/CourseCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: {
    name: string;
  };
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="overflow-hidden rounded-lg bg-white shadow-md transition-transform duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover"
          />
          {/* Category Badge */}
          <div className="absolute right-2 top-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
            {course.category.name}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {course.description}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <button className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
              Ver Curso →
            </button>
            <div className="text-xs text-gray-500">
              {/* Placeholder para rating */}⭐ 4.5
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
